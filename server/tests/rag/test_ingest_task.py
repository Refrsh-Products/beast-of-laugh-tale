"""Celery-wrapper tests for the current LlamaParse ingestion task."""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from celery.exceptions import MaxRetriesExceededError, Retry

from notebooks.models import NotebookFile
from rag.tasks import ingest_note_task
from tests.factories import NotebookFactory


def pending_file(user, *, error=""):
    notebook = NotebookFactory(user=user)
    return NotebookFile.objects.create(
        notebook=notebook,
        name="lecture.txt",
        file="notebooks/lecture.txt",
        file_size=12,
        file_type="txt",
        ingestion_error=error,
    )


def run_task(notebook_file):
    return ingest_note_task.apply(args=[str(notebook_file.pk)])


# Every attempt enters PROCESSING and clears a stale error before calling the pipeline.
@pytest.mark.django_db
def test_task_marks_file_processing_before_ingestion(user):
    notebook_file = pending_file(user, error="old failure")

    with patch("rag.tasks.ingest_note_to_rag", new_callable=AsyncMock) as ingest:
        result = run_task(notebook_file)
        result.get()

    notebook_file.refresh_from_db()
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.PROCESSING
    assert notebook_file.ingestion_error == ""
    ingest.assert_awaited_once_with(str(notebook_file.pk))


# Permanent parser or validation failures are saved and propagated to Celery.
@pytest.mark.django_db
def test_permanent_failure_marks_file_failed_and_reraises(user):
    notebook_file = pending_file(user)

    with patch(
        "rag.tasks.ingest_note_to_rag",
        new_callable=AsyncMock,
        side_effect=ValueError("Unsupported file type: sh"),
    ):
        result = run_task(notebook_file)
        with pytest.raises(ValueError, match="Unsupported file type"):
            result.get()

    notebook_file.refresh_from_db()
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.FAILED
    assert notebook_file.ingestion_error == "Unsupported file type: sh"


# Timeouts become a user-facing terminal failure instead of leaving PROCESSING forever.
@pytest.mark.django_db
def test_timeout_marks_file_failed_with_actionable_message(user):
    notebook_file = pending_file(user)

    with patch(
        "rag.tasks.ingest_note_to_rag",
        new_callable=AsyncMock,
        side_effect=asyncio.TimeoutError,
    ):
        result = run_task(notebook_file)
        result.get()

    notebook_file.refresh_from_db()
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.FAILED
    assert "timed out" in notebook_file.ingestion_error.lower()


# Transient provider failures retain PROCESSING and request exponential-backoff retry.
@pytest.mark.django_db
def test_transient_failure_requests_retry_with_backoff(user):
    notebook_file = pending_file(user)

    with patch(
        "rag.tasks.ingest_note_to_rag",
        new_callable=AsyncMock,
        side_effect=RuntimeError("503 service unavailable"),
    ), patch.object(
        ingest_note_task,
        "retry",
        side_effect=Retry("retry requested"),
    ) as retry:
        with pytest.raises(Retry):
            ingest_note_task.run(str(notebook_file.pk))

    notebook_file.refresh_from_db()
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.PROCESSING
    assert "attempt 1" in notebook_file.ingestion_error
    assert retry.call_args.kwargs["countdown"] == 60
    assert isinstance(retry.call_args.kwargs["exc"], RuntimeError)


# Retry exhaustion writes a stable failure status and does not rethrow again.
@pytest.mark.django_db
def test_retry_exhaustion_marks_file_failed(user):
    notebook_file = pending_file(user)

    with patch(
        "rag.tasks.ingest_note_to_rag",
        new_callable=AsyncMock,
        side_effect=MaxRetriesExceededError(),
    ):
        result = run_task(notebook_file)
        result.get()

    notebook_file.refresh_from_db()
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.FAILED
    assert "multiple retries" in notebook_file.ingestion_error.lower()
