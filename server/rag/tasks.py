import asyncio
from celery import shared_task
from .services import ingest_note_to_rag


@shared_task
def ingest_note_task(note_id):
    asyncio.run(ingest_note_to_rag(note_id))
