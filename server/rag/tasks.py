import asyncio
import logging
import threading
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from .services import ingest_note_to_rag, delete_file_vectors, delete_notebook_vectors

logger = logging.getLogger(__name__)

# Caps concurrent LlamaParse jobs across all task threads on this worker.
# Free tier limit: 5 concurrent extract jobs, 20 req/min — we stay below with 4.
#
# The prod worker runs `--pool=threads --concurrency=10`, so every task shares one
# process. An asyncio.Semaphore binds permanently to the first event loop that
# acquires it, but each task runs its own asyncio.run() (a fresh loop) — so a shared
# asyncio.Semaphore raises "bound to a different event loop" on concurrent tasks.
# A threading primitive is NOT loop-bound: it works across threads and is the correct
# cross-task limiter for a threads pool. Acquire it OUTSIDE asyncio.run().
_LLAMAPARSE_CONCURRENCY = 4
_LLAMAPARSE_SEMAPHORE = threading.BoundedSemaphore(_LLAMAPARSE_CONCURRENCY)

# Hard cap on a single ingestion so a hung upstream call (e.g. vector-store upsert)
# can't hold a worker thread — and its semaphore slot — indefinitely.
_INGEST_TIMEOUT_SECONDS = 600


def _is_llamaparse_transient(exc: Exception) -> bool:
    """Return True for errors that are safe to retry (rate limits, timeouts, 5xx)."""
    msg = str(exc).lower()
    transient_hints = ("429", "rate limit", "too many requests", "timeout", "timed out",
                       "503", "502", "500", "connection", "unavailable")
    return any(hint in msg for hint in transient_hints)


# Retry up to 4 times: waits 60s, 120s, 240s, 480s (covers most outages / rate-limit windows).
@shared_task(bind=True, max_retries=4)
def ingest_note_task(self, note_id):
    from notebooks.models import NotebookFile

    note = NotebookFile.objects.get(id=note_id)
    note.ingestion_status = NotebookFile.IngestionStatus.PROCESSING
    note.ingestion_error = ""
    note.save(update_fields=["ingestion_status", "ingestion_error"])

    async def _run():
        await asyncio.wait_for(
            ingest_note_to_rag(note_id), timeout=_INGEST_TIMEOUT_SECONDS
        )

    try:
        # Thread-level gate (works across the threads pool); the event loop lives
        # entirely inside asyncio.run(), so nothing loop-bound leaks between tasks.
        with _LLAMAPARSE_SEMAPHORE:
            asyncio.run(_run())
    except MaxRetriesExceededError:
        NotebookFile.objects.filter(id=note_id).update(
            ingestion_status=NotebookFile.IngestionStatus.FAILED,
            ingestion_error="Document processing failed after multiple retries. Please try re-uploading.",
        )
    except (asyncio.TimeoutError, TimeoutError):
        # str(TimeoutError()) is empty; write an explicit message so the file leaves
        # PROCESSING with something actionable instead of a blank error.
        logger.warning(
            "Ingestion for note %s exceeded %ds timeout — marking FAILED",
            note_id, _INGEST_TIMEOUT_SECONDS,
        )
        NotebookFile.objects.filter(id=note_id).update(
            ingestion_status=NotebookFile.IngestionStatus.FAILED,
            ingestion_error="Document processing timed out. Please try re-uploading.",
        )
    except Exception as exc:
        if _is_llamaparse_transient(exc):
            retry_number = self.request.retries + 1
            countdown = 60 * (2 ** self.request.retries)  # 60, 120, 240, 480 s
            logger.warning(
                "LlamaParse transient error (attempt %d/%d), retrying in %ds: %s",
                retry_number, self.max_retries + 1, countdown, exc,
            )
            NotebookFile.objects.filter(id=note_id).update(
                ingestion_status=NotebookFile.IngestionStatus.PROCESSING,
                ingestion_error=f"Processing delayed, retrying… (attempt {retry_number})",
            )
            raise self.retry(exc=exc, countdown=countdown)
        else:
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
