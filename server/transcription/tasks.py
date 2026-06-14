import logging
from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction

from accounts.models import Account
from accounts.services import quota
from rag.tasks import ingest_note_task

from notebooks.errors import FileQuotaExceededError, StorageQuotaExceededError
from notebooks.models import NotebookFile
from notebooks.services.activity import touch_notebook_activity
from .models import AudioTranscript
from .services.notes_generation import generate_notes_from_transcript
from transcription.services.transcription import TranscriptionFailed, transcribe_audio

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2)
def transcribe_audio_task(self, transcript_id: str, audio_storage_path: str, filename: str):
    """Read the temp audio file, transcribe via Gemini, persist + clean up.

    Audio is stored on disk only for the duration of this task — we delete it in
    `finally` whether or not transcription succeeds.
    """
    try:
        transcript = AudioTranscript.objects.get(id=transcript_id)
    except AudioTranscript.DoesNotExist:
        logger.warning("transcribe_audio_task: transcript %s no longer exists, cleaning up audio", transcript_id)
        try:
            default_storage.delete(audio_storage_path)
        except Exception as cleanup_err:
            logger.warning("Failed to delete orphan audio %s: %s", audio_storage_path, cleanup_err)
        return

    transcript.transcription_status = AudioTranscript.TranscriptionStatus.PROCESSING
    transcript.transcription_error = ""
    transcript.save(update_fields=["transcription_status", "transcription_error", "updated_at"])

    try:
        with default_storage.open(audio_storage_path, "rb") as fh:
            audio_bytes = fh.read()

        try:
            text = transcribe_audio(audio_bytes, filename)
        except TranscriptionFailed as exc:
            logger.warning("Transcription failed for %s: %s", transcript_id, exc)
            transcript.transcription_status = AudioTranscript.TranscriptionStatus.FAILED
            transcript.transcription_error = str(exc)
            transcript.save(update_fields=["transcription_status", "transcription_error", "updated_at"])
            return
        except Exception:
            logger.exception("Unexpected transcription error for %s", transcript_id)
            transcript.transcription_status = AudioTranscript.TranscriptionStatus.FAILED
            transcript.transcription_error = "Transcription failed. Please try again."
            transcript.save(update_fields=["transcription_status", "transcription_error", "updated_at"])
            return

        transcript.transcript_text = text
        transcript.transcription_status = AudioTranscript.TranscriptionStatus.READY
        transcript.save(update_fields=["transcript_text", "transcription_status", "updated_at"])
        touch_notebook_activity(notebook_id=transcript.notebook_id) # type: ignore
    finally:
        try:
            default_storage.delete(audio_storage_path)
            logger.info("Deleted temp audio %s", audio_storage_path)
        except Exception as cleanup_err:
            logger.warning("Failed to delete temp audio %s: %s", audio_storage_path, cleanup_err)


@shared_task(bind=True, max_retries=2)
def generate_notes_task(self, transcript_id: str, user_id: int):
    """Generate notes via Claude, persist them, create a NotebookFile, queue RAG ingestion."""
    try:
        transcript = AudioTranscript.objects.select_related("notebook").get(id=transcript_id)
    except AudioTranscript.DoesNotExist:
        logger.warning("generate_notes_task: transcript %s no longer exists", transcript_id)
        return

    transcript.notes_status = AudioTranscript.NotesStatus.PROCESSING
    transcript.notes_error = ""
    transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])

    try:
        notes_md = generate_notes_from_transcript(transcript.transcript_text, transcript.title)
    except Exception:
        logger.exception("Notes generation failed for %s", transcript_id)
        transcript.notes_status = AudioTranscript.NotesStatus.FAILED
        transcript.notes_error = "Notes generation failed. Please try again."
        transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])
        return

    notes_bytes = notes_md.encode("utf-8")
    safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in transcript.title)
    filename = f"{safe_title} - Notes.md"

    try:
        with transaction.atomic():
            account = Account.objects.select_for_update().get(user_id=user_id)
            if not quota.check_file_per_notebook_quota(account, transcript.notebook):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                raise FileQuotaExceededError(limit=limits["max_files_per_notebook"])
            if not quota.check_storage_quota(account, len(notes_bytes)):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                raise StorageQuotaExceededError(limit_bytes=limits["storage_mega_bytes"] * 1024 * 1024)

            django_file = ContentFile(notes_bytes, name=filename)
            notebook_file = NotebookFile.objects.create(
                notebook=transcript.notebook,
                name=filename,
                file=django_file,
                file_type="md",
            )
            notebook_file.file_url = notebook_file.file.url
            notebook_file.save(update_fields=["file_url"])

            transcript.notes_text = notes_md
            transcript.notes_file = notebook_file
            transcript.notes_status = AudioTranscript.NotesStatus.READY
            transcript.save(update_fields=["notes_text", "notes_file", "notes_status", "updated_at"])

            account.storage_bytes_used += len(notes_bytes)
            account.save()
            touch_notebook_activity(notebook_id=transcript.notebook_id) # type: ignore
    except FileQuotaExceededError:
        transcript.notes_status = AudioTranscript.NotesStatus.FAILED
        transcript.notes_error = "Your notebook is full. Delete some files and try again."
        transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])
        return
    except StorageQuotaExceededError:
        transcript.notes_status = AudioTranscript.NotesStatus.FAILED
        transcript.notes_error = "Your storage is full. Delete some files and try again."
        transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])
        return
    except Exception:
        logger.exception("Failed to persist notes for %s", transcript_id)
        transcript.notes_status = AudioTranscript.NotesStatus.FAILED
        transcript.notes_error = "Failed to save notes. Please try again."
        transcript.save(update_fields=["notes_status", "notes_error", "updated_at"])
        return

    ingest_note_task.delay(notebook_file.pk)  # type: ignore[attr-defined]
