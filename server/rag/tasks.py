import asyncio
from celery import shared_task
from .services import ingest_note_to_rag, delete_file_vectors, delete_notebook_vectors


@shared_task
def ingest_note_task(note_id):
    from notebooks.models import NotebookFile

    note = NotebookFile.objects.get(id=note_id)
    note.ingestion_status = NotebookFile.IngestionStatus.PROCESSING 
    note.ingestion_error = ""
    note.save(update_fields=["ingestion_status", "ingestion_error"])

    try:
        asyncio.run(ingest_note_to_rag(note_id))
    except Exception as exc:
        NotebookFile.objects.filter(id=note_id).update(
            ingestion_status=NotebookFile.IngestionStatus.FAILED, 
            ingestion_error=str(exc),
        )
        raise


@shared_task
def delete_file_vectors_task(notebook_file_id):
    asyncio.run(delete_file_vectors(str(notebook_file_id)))


@shared_task
def delete_notebook_vectors_task(notebook_id):
    asyncio.run(delete_notebook_vectors(str(notebook_id)))
