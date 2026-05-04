"""
Wikimedia Commons image search.

Used by the presentation generation pipeline to attach an image URL +
attribution to slides whose layout calls for one. Best-effort: any failure
(network, no results, parse error) returns None so the calling task can
record an empty slot without failing the whole presentation.
"""

import base64
import logging
import re
import time
from typing import Optional

import requests

logger = logging.getLogger(__name__)

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "Freshr/1.0 (https://freshr.app; contact: heyrefrsh@gmail.com)"
TIMEOUT_SECONDS = 6
MAX_RETRIES = 2
BACKOFF_SECONDS = 1.5

# MIME types browsers can render inline. Wikimedia also returns DjVu, TIFF,
# PDF, and other scanned-document formats with image/* MIME types — those
# trigger a download instead of rendering, so we filter them out.
RENDERABLE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}


_FALLBACK_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f3f4f6"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10 10"/>
  <g transform="translate(400,260)" fill="none" stroke="#9ca3af" stroke-width="6" stroke-linejoin="round">
    <rect x="-90" y="-65" width="180" height="130" rx="8"/>
    <circle cx="-45" cy="-25" r="15"/>
    <path d="M-80 55 L-20 -5 L25 35 L55 5 L80 40 L80 55 Z" fill="#d1d5db"/>
  </g>
  <text x="400" y="400" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="24" fill="#6b7280">Image unavailable</text>
</svg>"""

FALLBACK_IMAGE_URL = (
    "data:image/svg+xml;base64,"
    + base64.b64encode(_FALLBACK_SVG.encode("utf-8")).decode("ascii")
)


def fallback_image(query: str = "") -> dict:
    """Returned when Wikimedia search yields no usable result, so layouts that
    expect an image still render with a neutral placeholder."""
    return {
        "url": FALLBACK_IMAGE_URL,
        "attribution": "",
        "source_page": "",
    }


def _strip_html(text: str) -> str:
    """Wikimedia attribution fields contain HTML — strip tags to plain text."""
    return re.sub(r"<[^>]+>", "", text or "").strip()


def fetch_wikimedia_image(query: str) -> Optional[dict]:
    """
    Search Wikimedia Commons for an image matching the query and return
    {url, attribution, source_page} or None if no usable result is found.
    """
    if not query or not query.strip():
        return None

    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": query.strip(),
        "gsrnamespace": "6",
        "gsrlimit": "10",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
    }

    data = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = requests.get(
                WIKIMEDIA_API,
                params=params,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
                timeout=TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.warning("Wikimedia search failed for query=%r: %s", query, exc)
            return None

        if resp.status_code == 429:
            if attempt >= MAX_RETRIES:
                logger.warning("Wikimedia rate-limited query=%r; giving up after %d attempts", query, attempt + 1)
                return None
            retry_after = resp.headers.get("Retry-After")
            try:
                wait = float(retry_after) if retry_after else BACKOFF_SECONDS * (2 ** attempt)
            except ValueError:
                wait = BACKOFF_SECONDS * (2 ** attempt)
            logger.info("Wikimedia rate-limited query=%r; backing off %.1fs (attempt %d)", query, wait, attempt + 1)
            time.sleep(wait)
            continue

        try:
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Wikimedia search failed for query=%r: %s", query, exc)
            return None
        break

    if data is None:
        return None

    pages = (data.get("query") or {}).get("pages") or {}
    if not pages:
        return None

    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        mime = info.get("mime", "")
        if mime not in RENDERABLE_MIME_TYPES:
            continue
        url = info.get("url")
        if not url:
            continue

        meta = info.get("extmetadata") or {}
        artist = _strip_html((meta.get("Artist") or {}).get("value", ""))
        license_name = (meta.get("LicenseShortName") or {}).get("value", "")
        attribution = (
            f"{artist} ({license_name})" if artist and license_name
            else artist or license_name or "Wikimedia Commons"
        )
        title = page.get("title", "")
        source_page = (
            f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}"
            if title else url
        )

        return {
            "url": url,
            "attribution": attribution[:255],
            "source_page": source_page,
        }

    return None
