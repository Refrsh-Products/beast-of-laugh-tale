import uuid

from django.db import models

from notebooks.models import Notebook, NotebookFile


class AudioTranscript(models.Model):

    class TranscriptionStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    class NotesStatus(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(
        Notebook,
        related_name="audio_transcripts",
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    transcript_text = models.TextField(blank=True)
    notes_text = models.TextField(blank=True)
    notes_file = models.ForeignKey(
        NotebookFile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audio_transcript",
    )
    transcription_status = models.CharField(
        max_length=20,
        choices=TranscriptionStatus.choices,
        default=TranscriptionStatus.PENDING,
    )
    transcription_error = models.TextField(blank=True)
    notes_status = models.CharField(
        max_length=20,
        choices=NotesStatus.choices,
        default=NotesStatus.NOT_STARTED,
    )
    notes_error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.notebook})"
