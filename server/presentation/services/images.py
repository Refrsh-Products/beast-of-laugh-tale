"""
Wikimedia Commons image search.

Used by the presentation generation pipeline to attach an image URL +
attribution to slides whose layout calls for one. Best-effort: any failure
(network, no results, parse error) returns None so the calling task can
record an empty slot without failing the whole presentation.
"""

import logging
import re
from typing import Optional

import requests

logger = logging.getLogger(__name__)

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "Freshr/1.0 (https://freshr.app; contact: heyrefrsh@gmail.com)"
TIMEOUT_SECONDS = 6


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
        "gsrlimit": "5",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime",
    }

    try:
        resp = requests.get(
            WIKIMEDIA_API,
            params=params,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            timeout=TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Wikimedia search failed for query=%r: %s", query, exc)
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
        if not mime.startswith("image/"):
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
