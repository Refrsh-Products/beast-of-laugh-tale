import logging

from django.core.files.storage import default_storage
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from notebooks.services.activity import touch_notebook_activity
from notebooks.services.archive import assert_notebook_writable
from .errors import (
    AudioFileTooLargeError,
    PaidOnlyFeatureError,
    UnsupportedAudioFormatError,
)
from .models import AudioTranscript
from notebooks.models import Notebook
from accounts.models import Account
from accounts.services import quota
from .serializers import AudioTranscriptListSerializer, AudioTranscriptSerializer

from django.shortcuts import get_object_or_404
from .services.transcription import SUPPORTED_AUDIO_MIME_TYPES, MAX_AUDIO_BYTES
from .tasks import transcribe_audio_task, generate_notes_task
from rest_framework.permissions import IsAuthenticated


logger = logging.getLogger(__name__)

MAX_AUDIO_MB = MAX_AUDIO_BYTES // (1024 * 1024)


def _assert_audio_feature_access(user):
    """Raise PaidOnlyFeatureError if the user's plan does not include audio notes."""
    account = Account.objects.get(user=user)
    if not quota.check_audio_feature_access(account):
        raise PaidOnlyFeatureError(feature="Audio transcription")


class AudioTranscribeAPIView(APIView):
    """Accept an audio file, persist it to temp storage, kick off a Celery task,
    and return 202 immediately. The audio is deleted by the task when it finishes.
    """

    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    throttle_scope = "audio_transcribe"

    def post(self, request, notebook_id):
        _assert_audio_feature_access(request.user)
        notebook = get_object_or_404(Notebook, id=notebook_id, user=request.user)
        assert_notebook_writable(notebook)

        audio_file = request.FILES.get("file")
        if not audio_file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        ext = audio_file.name.rsplit(".", 1)[-1].lower() if "." in audio_file.name else ""
        if ext not in SUPPORTED_AUDIO_MIME_TYPES:
            raise UnsupportedAudioFormatError(ext)

        if audio_file.size > MAX_AUDIO_BYTES:
            raise AudioFileTooLargeError(max_mb=MAX_AUDIO_MB)

        lecture_title = (request.data.get("title") or audio_file.name.rsplit(".", 1)[0]).strip()

        # Create the row first so we have an ID to scope the temp filename.
        audio_transcript = AudioTranscript.objects.create(
            notebook=notebook,
            title=lecture_title,
            transcript_text="",
            transcription_status=AudioTranscript.TranscriptionStatus.PENDING,
        )

        # Persist the audio to temp storage. The Celery task deletes it when done
        # (success or failure) — this is the only path where audio touches disk.
        temp_path = f"audio_temp/{audio_transcript.id}.{ext}"
        saved_path = default_storage.save(temp_path, audio_file)

        transcribe_audio_task.delay(  # type: ignore[attr-defined]
            str(audio_transcript.id),
            saved_path,
            audio_file.name,
        )
        touch_notebook_activity(notebook_id=notebook.id)

        return Response(
            {
                "transcript_id": str(audio_transcript.pk),
                "transcription_status": audio_transcript.transcription_status,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AudioTranscriptUpdateAPIView(APIView):
    """Allow the user to save edits to a transcript before generating notes."""

    permission_classes = (IsAuthenticated,)
    throttle_scope = "audio_transcript_update"

    def patch(self, request, notebook_id, transcript_id):
        _assert_audio_feature_access(request.user)
        notebook = get_object_or_404(Notebook, id=notebook_id, user=request.user)
        assert_notebook_writable(notebook)
        
        audio_transcript = get_object_or_404(AudioTranscript, id=transcript_id, notebook_id=notebook_id)

        transcript_text = request.data.get("transcript_text")
        title = request.data.get("title")

        if transcript_text is not None:
            audio_transcript.transcript_text = transcript_text.strip()
        if title is not None:
            audio_transcript.title = title.strip()
        audio_transcript.save(update_fields=["transcript_text", "title", "updated_at"])

        return Response(AudioTranscriptSerializer(audio_transcript).data)


class GenerateNotesFromTranscriptAPIView(APIView):
    """Enqueue a Celery task to generate notes from a saved transcript. Returns 202.

    The task persists the notes back onto the AudioTranscript row and creates a
    NotebookFile so they show up in the files list and get RAG-ingested.
    """

    permission_classes = (IsAuthenticated,)
    throttle_scope = "audio_generate_notes"

    def post(self, request, notebook_id, transcript_id):
        _assert_audio_feature_access(request.user)
        notebook = get_object_or_404(Notebook, id=notebook_id, user=request.user)
        assert_notebook_writable(notebook)
        audio_transcript = get_object_or_404(AudioTranscript, id=transcript_id, notebook_id=notebook_id)

        if audio_transcript.transcription_status != AudioTranscript.TranscriptionStatus.READY:
            return Response(
                {"detail": "Transcript is not ready yet."},
                status=status.HTTP_409_CONFLICT,
            )
        if audio_transcript.notes_status == AudioTranscript.NotesStatus.PROCESSING:
            return Response(
                {"detail": "Notes are already being generated."},
                status=status.HTTP_409_CONFLICT,
            )

        audio_transcript.notes_status = AudioTranscript.NotesStatus.PROCESSING
        audio_transcript.notes_error = ""
        audio_transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])

        generate_notes_task.delay(str(audio_transcript.id), request.user.id)  # type: ignore[attr-defined]

        return Response(
            {"notes_status": audio_transcript.notes_status},
            status=status.HTTP_202_ACCEPTED,
        )


class AudioTranscriptListAPIView(generics.ListAPIView):
    """List all audio transcripts for a notebook, newest first."""

    serializer_class = AudioTranscriptListSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):  # type: ignore
        get_object_or_404(Notebook, id=self.kwargs["notebook_id"], user=self.request.user)
        return AudioTranscript.objects.filter(notebook_id=self.kwargs["notebook_id"])


class AudioTranscriptDetailAPIView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a single audio transcript (includes full transcript + notes text)."""

    serializer_class = AudioTranscriptSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):  # type: ignore
        get_object_or_404(Notebook, id=self.kwargs["notebook_id"], user=self.request.user)
        return AudioTranscript.objects.filter(notebook_id=self.kwargs["notebook_id"])