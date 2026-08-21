"""Batch photo-scan support: normalize camera photos, gate them through a
Gemini clarity/relevance check, and assemble the accepted batch into a single
multi-page PDF for the regular ingestion pipeline.

Fail-closed by design: if the validation model is unavailable we refuse the
batch (503) rather than let unchecked photos reach the expensive LlamaParse
agentic OCR tier.
"""

import io
import json
import logging
import os
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import filetype
from django.core.files.base import ContentFile
from google import genai
from google.genai import types as genai_types
from PIL import Image, ImageOps

from ..errors import InvalidScanImageError, ScanValidationUnavailableError

logger = logging.getLogger(__name__)

SCAN_MAX_PHOTO_BYTES = 15 * 1024 * 1024  # per raw photo, before normalization
SCAN_MAX_DIMENSION = 2000  # px, longest side after downscale
SCAN_JPEG_QUALITY = 80
SCAN_ALLOWED_TYPES = {"jpg", "jpeg", "png", "webp"}
SCAN_VALIDATION_MODEL = "gemini-2.5-flash-lite"
SCAN_VALIDATION_TIMEOUT_MS = 30_000
SCAN_VALIDATION_MAX_WORKERS = 5

SCAN_VALIDATION_PROMPT = """You are a strict gatekeeper for a study-notes app. The user photographed a page they
want to import into their study notebook. Decide whether this photo should be accepted.

ACCEPT only if BOTH are true:
1. CLARITY: The photo is sharp and well-lit enough that the text/diagrams on it can
   actually be read. Slight tilt or shadow is fine; illegible blur, heavy glare, or
   extreme darkness is not.
2. RELEVANCE: The photo shows study material - handwritten or printed notes, a
   textbook/slide/whiteboard/blackboard page, printed handouts, diagrams, formulas,
   or problem sets. Photos of people, pets, food, scenery, screenshots of chats,
   or anything that is not study material must be rejected.

Respond with ONLY this JSON object, no markdown, no extra keys:
{"acceptable": true or false,
 "clarity": "clear" or "blurry" or "unreadable",
 "relevance": "notes" or "unrelated",
 "reason": "<one short sentence addressed to the user; empty string if acceptable>"}"""


@dataclass
class NormalizedPhoto:
    index: int
    jpeg_bytes: bytes  # EXIF-transposed, downscaled, re-encoded JPEG
    width: int
    height: int


@dataclass
class PhotoValidationResult:
    index: int
    acceptable: bool
    clarity: str  # "clear" | "blurry" | "unreadable"
    relevance: str  # "notes" | "unrelated"
    reason: str  # short user-facing sentence, empty when acceptable


def _get_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)


def normalize_photos(photos) -> list[NormalizedPhoto]:
    """Decode, EXIF-transpose, downscale, and re-encode each uploaded photo.

    The normalized bytes feed both the Gemini check and the final PDF, so the
    image we validate is exactly the image we ingest.
    """
    normalized: list[NormalizedPhoto] = []
    for index, uploaded in enumerate(photos):
        if uploaded.size > SCAN_MAX_PHOTO_BYTES:
            raise InvalidScanImageError(
                index=index,
                reason=f"Photo {index + 1} is too large (max {SCAN_MAX_PHOTO_BYTES // (1024 * 1024)}MB).",
            )

        uploaded.seek(0)
        raw = uploaded.read()

        kind = filetype.guess(raw)
        if kind is None or kind.extension not in SCAN_ALLOWED_TYPES:
            raise InvalidScanImageError(
                index=index,
                reason=f"Photo {index + 1} is not a supported image (JPEG, PNG, or WebP).",
            )

        try:
            img = Image.open(io.BytesIO(raw))
            # Phone cameras store rotation in EXIF; Pillow's PDF writer ignores
            # it, so bake the orientation into the pixels.
            img = ImageOps.exif_transpose(img)
            img.thumbnail((SCAN_MAX_DIMENSION, SCAN_MAX_DIMENSION))
            img = img.convert("RGB")
        except Exception as err:
            logger.warning("Failed to decode scan photo %d: %s", index, err)
            raise InvalidScanImageError(index=index) from err

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=SCAN_JPEG_QUALITY)
        normalized.append(
            NormalizedPhoto(
                index=index,
                jpeg_bytes=buf.getvalue(),
                width=img.width,
                height=img.height,
            )
        )
    return normalized


def _parse_validation_response(index: int, raw_text: str) -> PhotoValidationResult:
    text = raw_text.strip()
    # Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError(f"Expected a JSON object, got {type(data).__name__}")
    return PhotoValidationResult(
        index=index,
        acceptable=bool(data.get("acceptable")),
        clarity=str(data.get("clarity") or "unreadable"),
        relevance=str(data.get("relevance") or "unrelated"),
        reason=str(data.get("reason") or ""),
    )


def _validate_one_photo(client: genai.Client, photo: NormalizedPhoto) -> PhotoValidationResult:
    response = client.models.generate_content(
        model=SCAN_VALIDATION_MODEL,
        contents=genai_types.Content(
            role="user",
            parts=[
                genai_types.Part.from_bytes(
                    data=photo.jpeg_bytes,
                    mime_type="image/jpeg",
                ),
                genai_types.Part.from_text(text=SCAN_VALIDATION_PROMPT),
            ],
        ),
        config=genai_types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0,
            http_options=genai_types.HttpOptions(timeout=SCAN_VALIDATION_TIMEOUT_MS),
        ),
    )
    return _parse_validation_response(photo.index, response.text or "")


def validate_photos_with_gemini(photos: list[NormalizedPhoto]) -> list[PhotoValidationResult]:
    """Run the clarity/relevance check on every photo in parallel.

    Raises ScanValidationUnavailableError if any call fails or returns
    unparseable output — the caller must not ingest unvalidated photos.
    """
    client = _get_client()
    try:
        with ThreadPoolExecutor(max_workers=min(len(photos), SCAN_VALIDATION_MAX_WORKERS)) as pool:
            results = list(pool.map(lambda p: _validate_one_photo(client, p), photos))
    except Exception:
        logger.exception("Scan photo validation failed")
        raise ScanValidationUnavailableError()

    for result in results:
        logger.info(
            "Scan photo %d validation: acceptable=%s clarity=%s relevance=%s",
            result.index, result.acceptable, result.clarity, result.relevance,
        )
    return results


def build_scan_pdf(photos: list[NormalizedPhoto], filename: str) -> ContentFile:
    """Merge the normalized photos, in order, into one multi-page PDF."""
    images = [Image.open(io.BytesIO(p.jpeg_bytes)) for p in photos]
    buf = io.BytesIO()
    images[0].save(
        buf,
        format="PDF",
        save_all=True,
        append_images=images[1:],
        resolution=150,
    )
    return ContentFile(buf.getvalue(), name=filename)
