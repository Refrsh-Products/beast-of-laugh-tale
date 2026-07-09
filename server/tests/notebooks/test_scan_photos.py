"""Tests for the batch photo-scan endpoint (POST notebooks/<id>/files/scan).

The Gemini validation call is mocked everywhere (no network / no API key
needed); normalization and PDF assembly run for real against tiny Pillow-
generated JPEGs.
"""

import io
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from PIL import Image
from pypdf import PdfReader
from rest_framework import status

from accounts.models import SubscriptionStatus, TierPlan
from notebooks.models import NotebookFile
from notebooks.services.photo_scan import PhotoValidationResult
from tests.factories import AccountFactory, NotebookFactory

# Path where the view looks up validate_photos_with_gemini (module object is
# shared, so patching here also covers the `photo_scan.` reference in views).
VALIDATE_PATH = "notebooks.services.photo_scan.validate_photos_with_gemini"
INGEST_PATH = "notebooks.views.ingest_note_task"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _jpeg_bytes(size=(64, 64), color=(255, 255, 255), exif=None) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color)
    if exif is not None:
        img.save(buf, format="JPEG", exif=exif)
    else:
        img.save(buf, format="JPEG")
    return buf.getvalue()


def _photo(name="page.jpg", data=None) -> SimpleUploadedFile:
    return SimpleUploadedFile(name, data or _jpeg_bytes(), content_type="image/jpeg")


def _accept_all(photos):
    return [
        PhotoValidationResult(index=i, acceptable=True, clarity="clear", relevance="notes", reason="")
        for i, _ in enumerate(photos)
    ]


def _scan_url(notebook):
    return reverse("notebooks:file-scan", kwargs={"notebook_id": notebook.id})


def _paid_account(user):
    return AccountFactory(
        user=user,
        tier_plan=TierPlan.PAID,
        subscription_status=SubscriptionStatus.ACTIVE,
        subscription_end_date=timezone.now() + timedelta(days=30),
    )


# ---------------------------------------------------------------------------
# Happy paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_scan_two_photos_creates_single_pdf(authenticated_client, user, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    AccountFactory(user=user)  # FREE, limit 2
    notebook = NotebookFactory(user=user)

    with patch(VALIDATE_PATH, side_effect=_accept_all) as mock_validate, \
         patch(INGEST_PATH) as mock_ingest:
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg"), _photo("p2.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    body = response.json()
    assert body["success"] is True
    assert body["photo_count"] == 2

    files = NotebookFile.objects.filter(notebook=notebook)
    assert files.count() == 1
    nf = files.first()
    assert nf.file_type == "pdf" # type: ignore
    assert nf.name.endswith(".pdf") # type: ignore

    reader = PdfReader(nf.file.path) # type: ignore
    assert len(reader.pages) == 2

    notebook.user.account.refresh_from_db()
    assert notebook.user.account.storage_bytes_used == nf.file_size # type: ignore
    mock_validate.assert_called_once()
    mock_ingest.delay.assert_called_once_with(nf.pk) # type: ignore


@pytest.mark.django_db
def test_paid_user_can_scan_ten_photos(authenticated_client, user, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    _paid_account(user)
    notebook = NotebookFactory(user=user)

    with patch(VALIDATE_PATH, side_effect=_accept_all), patch(INGEST_PATH):
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo(f"p{i}.jpg") for i in range(10)]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["photo_count"] == 10
    nf = NotebookFile.objects.get(notebook=notebook)
    assert len(PdfReader(nf.file.path).pages) == 10


# ---------------------------------------------------------------------------
# Rejections / limits
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_one_unacceptable_photo_rejects_whole_batch(authenticated_client, user, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    def _one_bad(photos):
        return [
            PhotoValidationResult(index=0, acceptable=True, clarity="clear", relevance="notes", reason=""),
            PhotoValidationResult(
                index=1, acceptable=False, clarity="clear", relevance="unrelated",
                reason="This looks like a photo of a pet, not study notes.",
            ),
        ]

    with patch(VALIDATE_PATH, side_effect=_one_bad), patch(INGEST_PATH) as mock_ingest:
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg"), _photo("p2.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    body = response.json()
    assert body["code"] == "photo_validation_failed"
    assert body["photos"][1]["acceptable"] is False
    assert body["photos"][1]["relevance"] == "unrelated"
    assert "pet" in body["photos"][1]["reason"]

    assert NotebookFile.objects.filter(notebook=notebook).count() == 0
    mock_ingest.delay.assert_not_called()


@pytest.mark.django_db
def test_free_user_over_photo_limit_is_rejected_before_gemini(authenticated_client, user):
    AccountFactory(user=user)  # FREE, limit 2
    notebook = NotebookFactory(user=user)

    with patch(VALIDATE_PATH) as mock_validate, patch(INGEST_PATH) as mock_ingest:
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg"), _photo("p2.jpg"), _photo("p3.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "scan_photo_limit_exceeded"
    mock_validate.assert_not_called()
    mock_ingest.delay.assert_not_called()


@pytest.mark.django_db
def test_notebook_file_quota_full_rejects_before_gemini(authenticated_client, user):
    AccountFactory(user=user)  # FREE: max 2 files/notebook
    notebook = NotebookFactory(user=user)
    for i in range(2):
        NotebookFile.objects.create(
            notebook=notebook,
            name=f"existing{i}.pdf",
            file_type="pdf",
            file=SimpleUploadedFile(f"existing{i}.pdf", b"x", content_type="application/pdf"),
        )

    with patch(VALIDATE_PATH) as mock_validate, patch(INGEST_PATH) as mock_ingest:
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "file_quota_exceeded"
    mock_validate.assert_not_called()
    mock_ingest.delay.assert_not_called()


# ---------------------------------------------------------------------------
# Bad input / infra failure
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_non_image_file_is_rejected(authenticated_client, user):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    bad = SimpleUploadedFile("notes.txt", b"this is not an image", content_type="text/plain")
    with patch(VALIDATE_PATH), patch(INGEST_PATH):
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [bad]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert NotebookFile.objects.filter(notebook=notebook).count() == 0


@pytest.mark.django_db
def test_gemini_unavailable_returns_503(authenticated_client, user, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    from notebooks.errors import ScanValidationUnavailableError

    with patch(VALIDATE_PATH, side_effect=ScanValidationUnavailableError()), \
         patch(INGEST_PATH) as mock_ingest:
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.json()["code"] == "scan_validation_unavailable"
    assert NotebookFile.objects.filter(notebook=notebook).count() == 0
    mock_ingest.delay.assert_not_called()


@pytest.mark.django_db
def test_archived_notebook_rejects_scan(authenticated_client, user):
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user, is_archived=True)

    with patch(VALIDATE_PATH) as mock_validate, patch(INGEST_PATH):
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("p1.jpg")]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "notebook_archived"
    mock_validate.assert_not_called()


# ---------------------------------------------------------------------------
# Image handling
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_exif_orientation_is_applied_to_pdf_page(authenticated_client, user, settings, tmp_path):
    settings.MEDIA_ROOT = str(tmp_path)
    AccountFactory(user=user)
    notebook = NotebookFactory(user=user)

    # Landscape 100x50 image tagged orientation=6 (rotate 90°) → after
    # exif_transpose the stored pixels become portrait (50x100), so the PDF
    # page must be taller than it is wide.
    exif = Image.Exif()
    exif[0x0112] = 6
    wide = _jpeg_bytes(size=(100, 50), exif=exif)

    with patch(VALIDATE_PATH, side_effect=_accept_all), patch(INGEST_PATH):
        response = authenticated_client.post(
            _scan_url(notebook),
            {"photos": [_photo("rotated.jpg", data=wide)]},
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    nf = NotebookFile.objects.get(notebook=notebook)
    page = PdfReader(nf.file.path).pages[0]
    assert float(page.mediabox.height) > float(page.mediabox.width)
