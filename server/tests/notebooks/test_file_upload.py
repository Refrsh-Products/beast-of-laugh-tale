"""Upload-endpoint coverage for the current file-ingestion entry point.

Celery is mocked throughout: these tests verify request validation, persistence,
quota accounting, and dispatch without contacting Redis or an AI provider.
"""

from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status

from notebooks.models import NotebookFile
from tests.factories import AccountFactory, NotebookFactory


INGEST_DELAY_PATH = "notebooks.views.ingest_note_task.delay"


def file_upload_url(notebook):
    return reverse(
        "notebooks:file-create",
        kwargs={"notebook_id": notebook.pk},
    )


def upload(name="lecture.pdf", content=b"course notes"):
    return SimpleUploadedFile(name, content, content_type="application/pdf")


def stored_file(notebook, name="existing.pdf", size=10):
    return NotebookFile.objects.create(
        notebook=notebook,
        name=name,
        file=f"notebooks/{name}",
        file_size=size,
        file_type=name.rsplit(".", 1)[-1],
    )


# A valid upload is persisted, accounted for, and queued for ingestion.
@pytest.mark.django_db
def test_upload_saves_file_and_dispatches_ingestion(
    authenticated_client,
    user,
    settings,
    tmp_path,
):
    settings.MEDIA_ROOT = str(tmp_path)
    account = AccountFactory(user=user)
    notebook = NotebookFactory(user=user)
    payload = b"small PDF fixture"

    with patch(INGEST_DELAY_PATH) as mock_delay:
        response = authenticated_client.post(
            file_upload_url(notebook),
            {"file": upload(content=payload)},
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    notebook_file = NotebookFile.objects.get(pk=response.json()["id"])
    assert notebook_file.notebook == notebook
    assert notebook_file.name == "lecture.pdf"
    assert notebook_file.file_type == "pdf"
    assert notebook_file.file_size == len(payload)
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.PENDING
    assert notebook_file.file.path.startswith(str(tmp_path))
    account.refresh_from_db()
    assert account.storage_bytes_used == len(payload)
    mock_delay.assert_called_once_with(notebook_file.pk)


# The multipart serializer rejects a request that contains no file.
@pytest.mark.django_db
def test_upload_requires_file(authenticated_client, user):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    with patch(INGEST_DELAY_PATH) as mock_delay:
        response = authenticated_client.post(
            file_upload_url(notebook),
            {},
            format="multipart",
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not NotebookFile.objects.filter(notebook=notebook).exists()
    mock_delay.assert_not_called()


# Authentication is required before any file can be persisted.
@pytest.mark.django_db
def test_upload_requires_authentication(api_client):
    notebook = NotebookFactory()

    response = api_client.post(
        file_upload_url(notebook),
        {"file": upload()},
        format="multipart",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert not NotebookFile.objects.filter(notebook=notebook).exists()


# Notebook ownership is hidden behind a 404 response.
@pytest.mark.django_db
def test_upload_rejects_another_users_notebook(authenticated_client):
    notebook = NotebookFactory()

    response = authenticated_client.post(
        file_upload_url(notebook),
        {"file": upload()},
        format="multipart",
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert not NotebookFile.objects.filter(notebook=notebook).exists()


# Archived notebooks are read-only and cannot accept new source material.
@pytest.mark.django_db
def test_upload_rejects_archived_notebook(authenticated_client, user):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user, is_archived=True)

    response = authenticated_client.post(
        file_upload_url(notebook),
        {"file": upload()},
        format="multipart",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "notebook_archived"
    assert not NotebookFile.objects.filter(notebook=notebook).exists()


# The per-notebook file cap is enforced before the upload is saved or queued.
@pytest.mark.django_db
def test_upload_rejects_file_count_above_plan_limit(
    authenticated_client,
    user,
    settings,
):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)
    limit = settings.FRESHR_TIER_LIMITS["FREE"]["max_files_per_notebook"]
    assert isinstance(limit, int)
    for index in range(limit):
        stored_file(notebook, name=f"existing-{index}.pdf")

    with patch(INGEST_DELAY_PATH) as mock_delay:
        response = authenticated_client.post(
            file_upload_url(notebook),
            {"file": upload("over-limit.pdf")},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "file_quota_exceeded"
    assert NotebookFile.objects.filter(notebook=notebook).count() == limit
    mock_delay.assert_not_called()


# The plan's per-file byte limit is enforced before writing to storage.
@pytest.mark.django_db
def test_upload_rejects_file_above_size_limit(
    authenticated_client,
    user,
    settings,
    monkeypatch,
):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)
    monkeypatch.setitem(
        settings.FRESHR_TIER_LIMITS["FREE"],
        "max_size_per_file_mega_bytes",
        0,
    )

    with patch(INGEST_DELAY_PATH) as mock_delay:
        response = authenticated_client.post(
            file_upload_url(notebook),
            {"file": upload(content=b"x")},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "file_size_exceeded"
    assert not NotebookFile.objects.filter(notebook=notebook).exists()
    mock_delay.assert_not_called()


# Total account storage is checked independently of the individual-file limit.
@pytest.mark.django_db
def test_upload_rejects_account_storage_overflow(
    authenticated_client,
    user,
    settings,
):
    storage_limit = settings.FRESHR_TIER_LIMITS["FREE"]["storage_mega_bytes"]
    account = AccountFactory(
        user=user,
        storage_bytes_used=storage_limit * 1024 * 1024,
    )
    notebook = NotebookFactory(user=user)

    with patch(INGEST_DELAY_PATH) as mock_delay:
        response = authenticated_client.post(
            file_upload_url(notebook),
            {"file": upload(content=b"x")},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "storage_quota_exceeded"
    assert not NotebookFile.objects.filter(notebook=notebook).exists()
    account.refresh_from_db()
    assert account.storage_bytes_used == storage_limit * 1024 * 1024
    mock_delay.assert_not_called()


# Uploaded paths are reduced to a base filename before model persistence.
@pytest.mark.django_db
def test_upload_strips_directory_components_from_filename(
    authenticated_client,
    user,
    settings,
    tmp_path,
):
    settings.MEDIA_ROOT = str(tmp_path)
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    with patch(INGEST_DELAY_PATH):
        response = authenticated_client.post(
            file_upload_url(notebook),
            {"file": upload("../../lecture.pdf")},
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    notebook_file = NotebookFile.objects.get(pk=response.json()["id"])
    assert notebook_file.name == "lecture.pdf"


# Dispatch happens after the database transaction, so a broker error leaves the file recoverable.
@pytest.mark.django_db
def test_dispatch_failure_leaves_saved_file_and_storage_accounting(
    authenticated_client,
    user,
    settings,
    tmp_path,
):
    settings.MEDIA_ROOT = str(tmp_path)
    account = AccountFactory(user=user)
    notebook = NotebookFactory(user=user)
    payload = b"saved before dispatch"

    with patch(INGEST_DELAY_PATH, side_effect=RuntimeError("Redis unavailable")):
        with pytest.raises(RuntimeError, match="Redis unavailable"):
            authenticated_client.post(
                file_upload_url(notebook),
                {"file": upload(content=payload)},
                format="multipart",
            )

    notebook_file = NotebookFile.objects.get(notebook=notebook)
    assert notebook_file.ingestion_status == NotebookFile.IngestionStatus.PENDING
    account.refresh_from_db()
    assert account.storage_bytes_used == len(payload)
