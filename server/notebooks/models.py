import uuid

from django.db import models
from django.conf import settings
from django.utils import timezone

class Notebook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notebooks")
    title = models.CharField(max_length=255)
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pinned = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class NotebookFile(models.Model):

    class IngestionStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(
            Notebook,
            related_name="files",
            on_delete=models.CASCADE
            )

    name = models.CharField(max_length=255, default="Untitled")
    file_url = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveBigIntegerField(default=0)
    file_type = models.CharField(max_length=20)
    ingestion_status = models.CharField(
        max_length=20,
        choices=IngestionStatus.choices,
        default=IngestionStatus.PENDING,
    )
    ingestion_error = models.TextField(blank=True)


    file = models.FileField(upload_to="notebooks/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name}"
