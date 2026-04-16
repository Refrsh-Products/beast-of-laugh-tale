import uuid
from django.db import models
from pgvector.django import VectorField
from notebooks.models import Notebook


class NotebookTopic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="topics")
    name = models.CharField(max_length=255)
    embedding = VectorField(dimensions=3072)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["notebook"], name="rag_notebooktopic_notebook_idx"),
        ]

    def __str__(self):
        return f"{self.name} ({self.notebook_id})"
