from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Notebook, NotebookFile


@receiver(post_delete, sender=NotebookFile)
def cleanup_notebook_file_vectors(sender, instance, **kwargs):
    """Remove PGVector chunks when a NotebookFile is deleted."""
    if instance.ingestion_status != NotebookFile.IngestionStatus.READY:
        return
    from rag.tasks import delete_file_vectors_task
    delete_file_vectors_task.delay(str(instance.pk)) # type: ignore


@receiver(post_delete, sender=Notebook)
def cleanup_notebook_vectors(sender, instance, **kwargs):
    """Remove all PGVector chunks when a Notebook is deleted.

    NotebookFile rows are already cascade-deleted by Django before this signal
    fires, so we clean up at the notebook level to catch any stragglers and
    avoid firing N per-file tasks for a bulk delete.
    """
    from rag.tasks import delete_notebook_vectors_task
    delete_notebook_vectors_task.delay(str(instance.pk)) # type: ignore
