"""
Presentation generation service.

generate_presentation_from_rag() retrieves relevant chunks from the vector
store for the selected topic, runs a two-stage Claude pipeline (outline ->
drafts) with Wikimedia image lookup overlapping the drafts, and returns a
structured deck with images already attached to each slide. The Celery task
layer wraps this function and persists the result.

Unlike quiz generation, this service does NOT silently fall back to mock
content on failure: empty RAG context raises InsufficientContextError, and
LLM/JSON failures bubble up so the Celery task can mark the presentation
FAILED with an appropriate error_message.
"""

import os
import json
import asyncio
import concurrent.futures
import threading
from typing import TypedDict
import logging

from anthropic import Anthropic
from anthropic.types import TextBlock

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

# Slide drafts are independent Claude calls that spend nearly all their time
# waiting on the network, so a flat cap of 5 just queued decks into waves —
# slide_count is validated up to 30 (presentation/serializers.py). Bounded
# rather than unbounded: the Celery worker runs --pool=threads --concurrency=10,
# so per-task threads multiply across concurrent presentations, and a large
# simultaneous burst of Haiku calls invites 429s.
_MAX_DRAFT_WORKERS = 12

# Wikimedia rate-limits aggressive concurrency at the CDN — keep this small.
_MAX_IMAGE_WORKERS = 3

LAYOUTS = {
    "bullets": {
        "image_count": 0,
        "purpose": "Standard text-only slide: a title with a list of supporting bullets.",
        "use_when": "The point is best conveyed as 2-5 discrete, parallel ideas AND no visual meaningfully reinforces them.",
        "avoid_when": "Default to image-bearing layouts ('image-right', 'image-left', 'image-top') whenever a relevant visual exists for the content. Use 'bullets' only when no image meaningfully reinforces the points. Also avoid when the content is a single dominant idea ('title-only'), flows as prose ('body-text'), or splits into two parallel groups ('two-col').",
    },
    "title-only": {
        "image_count": 0,
        "purpose": "A single large title with no body — section break or punchy statement.",
        "use_when": "Introducing a new section, posing a rhetorical question, or making one bold standalone statement that needs no supporting visual.",
        "avoid_when": "Any supporting detail is needed — use 'bullets' or 'body-text' instead. Also avoid when a striking visual could carry the slide more powerfully ('full-image' or 'image-top').",
    },
    "body-text": {
        "image_count": 0,
        "purpose": "Title plus a paragraph of flowing prose — for narrative or explanatory text that doesn't decompose into bullets.",
        "use_when": "The idea is a continuous explanation, definition, or story that loses meaning when fragmented into bullets AND no relevant visual exists.",
        "avoid_when": "Prefer image-bearing layouts ('image-right', 'image-left') when a relevant visual exists — pairing prose with an anchoring image is more engaging. Also avoid when the content is genuinely list-like (use 'bullets') or comparative (use 'two-col').",
    },
    "two-col": {
        "image_count": 0,
        "purpose": "Compare or contrast two related groups of points side by side. Bullets are split evenly into left and right columns.",
        "use_when": "Content naturally splits into two parallel groupings (pros/cons, before/after, theory/practice, type-A/type-B) AND no visual meaningfully captures the comparison.",
        "avoid_when": "Prefer 'two-images' when each side has a corresponding visual, or 'image-right'/'image-left' when one side could be illustrated. Also avoid when there's only one set of ideas (use 'bullets') or three+ groupings.",
    },
    "image-right": {
        "image_count": 1,
        "purpose": "Title and bullets on the left, supporting image on the right.",
        "use_when": "An image meaningfully reinforces the bullets — a diagram, photograph of the named entity, or visual example.",
        "avoid_when": "No relevant image exists, or the image is the main point (use 'full-image').",
    },
    "image-left": {
        "image_count": 1,
        "purpose": "Image on the left, title and bullets on the right — same as 'image-right' with reversed visual emphasis.",
        "use_when": "You want the eye to land on the image first before reading the bullets, or to vary visual rhythm across consecutive slides.",
        "avoid_when": "No relevant image exists, or the image is the main point (use 'full-image').",
    },
    "full-image": {
        "image_count": 1,
        "purpose": "A single dominant image filling the slide, with a small caption beneath. High visual impact.",
        "use_when": "One striking visual carries the meaning on its own; the caption is just a label or short attribution.",
        "avoid_when": "The point requires multiple bullets or detailed explanation — use 'image-right'/'image-left' instead.",
    },
    "image-top": {
        "image_count": 1,
        "purpose": "Image fills the top half; title and up to 2 bullets sit below.",
        "use_when": "The image is the lede and 1-2 short takeaways frame it. Good for case studies or example-driven slides.",
        "avoid_when": "You need 3+ bullets (use 'image-right'/'image-left') or the image needs to dominate without text ('full-image').",
    },
    "quote": {
        "image_count": 0,
        "purpose": "A centered pull-quote with attribution — emphasizes a single memorable statement.",
        "use_when": "A direct quotation from a named source anchors the slide's meaning.",
        "avoid_when": "The content is your own paraphrase or analysis, not a sourced quotation.",
    },
    "two-images": {
        "image_count": 2,
        "purpose": "Title across the top, two images side by side, each with a short caption from the bullets list.",
        "use_when": "Two visuals must be seen together — comparison, before/after, two examples of the same concept.",
        "avoid_when": "Only one image is needed (use 'image-right'/'image-left') or the images need explanatory bullets rather than captions.",
    },
}


TEXT_LENGTH_GUIDANCE = {
    "BRIEF": "Each bullet should be ~8 words. Concise, punchy, scannable.",
    "BALANCED": "Each bullet should be ~15 words. Clear and complete but not verbose.",
    "DETAILED": "Each bullet should be ~25 words. Thorough explanation with specifics.",
}


class OutlineSlide(TypedDict):
    order_index: int
    title: str
    layout: str
    bullet_seeds: list[str]
    image_queries: list[str]


class _DraftedSlideRequired(TypedDict):
    order_index: int
    title: str
    layout: str
    bullets: list[str]
    speaker_notes: str
    image_queries: list[str]


class DraftedSlide(_DraftedSlideRequired, total=False):
    body_text: str
    quote: str
    quote_source: str
    caption: str
    # Resolved {query, url, attribution, source_page} entries. Set by the
    # orchestrator, not by draft_single_slide.
    images: list[dict]


class GeneratedPresentation(TypedDict):
    title: str
    slides: list[DraftedSlide]


class InsufficientContextError(Exception):
    """Raised when RAG retrieval returns no usable chunks for the topic."""
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────

_anthropic_client: Anthropic | None = None
_anthropic_client_lock = threading.Lock()


def _client() -> Anthropic:
    """Return the process-wide Anthropic client, built on first use.

    Shared rather than per-call so the drafting threads reuse one HTTP
    connection pool instead of each opening their own — worth roughly 0.1s a
    call, which is small but free, and every call here is on the critical path.
    The SDK's sync client wraps a thread-safe httpx.Client, so sharing it across
    the draft pool is safe. Built lazily so forked gunicorn workers don't
    inherit a parent's sockets.
    """
    global _anthropic_client

    if _anthropic_client is not None:
        return _anthropic_client

    with _anthropic_client_lock:
        if _anthropic_client is None:
            _anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    return _anthropic_client


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
        text = text.strip()
    return text


def _call_llm_json(prompt: str, max_tokens: int = 8192, temperature: float = 0.4) -> dict:
    response = _client().messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}],
    )
    block = response.content[0]
    if not isinstance(block, TextBlock):
        raise ValueError("LLM returned non-text response")
    return json.loads(_strip_fences(block.text))


# ── Stage 1: outline ─────────────────────────────────────────────────────────

def generate_outline(
    topic: str,
    custom_prompt: str,
    slide_count: int,
    text_length: str,
    context: str,
) -> tuple[str, list[OutlineSlide]]:
    layouts = ", ".join(LAYOUTS.keys())
    layout_rules = "\n".join(
        f"  - {name}: {spec['image_count']} image{'s' if spec['image_count'] != 1 else ''}"
        f" — {spec['purpose']} Use when: {spec['use_when']} Avoid when: {spec['avoid_when']}"
        for name, spec in LAYOUTS.items()
    )

    custom_prompt_block = (
        f"\nUSER GUIDANCE (incorporate this when planning slides):\n{custom_prompt.strip()}\n"
        if custom_prompt.strip()
        else ""
    )

    prompt = f"""You are an expert educational presentation designer.

TOPIC: {topic}
TARGET SLIDE COUNT: {slide_count}
{custom_prompt_block}
LECTURE CONTENT:
{context}

Plan a {slide_count}-slide deck. Each slide must reference a specific named entity from the source content — avoid generic titles like "Introduction" or "Conclusion" unless the content genuinely warrants them. Slide 1 should be a title slide; the rest should progressively cover the topic.

VISUAL DENSITY TARGET: Aim for roughly 50-70% of the {slide_count} slides to use an image-bearing layout ('image-right', 'image-left', 'full-image', 'image-top', 'two-images'). Visuals make presentations more engaging — only fall back to a text-only layout when the content genuinely doesn't have a visual that could anchor it. Before finalizing, count your image-bearing slides and confirm the ratio is in this range; if it isn't, reconsider whether a text-only slide could be paired with a relevant image.

For each slide pick a layout from: {layouts}.
Image counts per layout (the image_queries array MUST have this many entries):
{layout_rules}

Each image_query is a short search phrase (3-8 words) suitable for Wikimedia Commons. Use specific named entities, not abstract concepts. Prefer to find a visual rather than default to a text-only layout — only choose a zero-image layout ('bullets', 'title-only', 'body-text', 'two-col', 'quote') when you genuinely cannot identify a relevant image.

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "presentation_title": "...",
  "slides": [
    {{
      "order_index": 0,
      "title": "...",
      "layout": "title-only",
      "bullet_seeds": ["short phrase to expand into a bullet later", "..."],
      "image_queries": []
    }},
    ...
  ]
}}

Rules:
- presentation_title: a polished, concise deck title (max 80 characters) derived from the topic and content. Avoid generic phrasings like "Overview of X" — make it specific and engaging.
- Exactly {slide_count} slides
- order_index is 0-based and sequential
- Every layout must be one of the listed values
- image_queries length must match the layout's image count exactly
- bullet_seeds: 2-5 short phrases per slide (these become full bullets in stage 2)"""

    raw = _call_llm_json(prompt)
    slides = raw.get("slides", [])
    if not slides:
        raise ValueError("Outline LLM returned no slides")

    deck_title = (raw.get("presentation_title") or topic).strip()[:80]

    cleaned: list[OutlineSlide] = []
    for i, s in enumerate(slides[:slide_count]):
        layout = s.get("layout", "bullets")
        if layout not in LAYOUTS:
            layout = "bullets"
        expected_imgs = LAYOUTS[layout]["image_count"]
        image_queries = list(s.get("image_queries", []) or [])[:expected_imgs]
        while len(image_queries) < expected_imgs:
            image_queries.append(s.get("title", topic))
        cleaned.append({
            "order_index": i,
            "title": s.get("title", "")[:255],
            "layout": layout,
            "bullet_seeds": list(s.get("bullet_seeds", []) or []),
            "image_queries": image_queries,
        })
    return deck_title, cleaned


# ── Stage 2: draft slides ────────────────────────────────────────────────────

_LAYOUT_DRAFT_INSTRUCTIONS: dict[str, dict[str, str]] = {
    "bullets": {
        "instruction": 'Expand bullet_seeds into 2-5 full bullets (matching the text length guidance).',
        "schema": '"bullets": ["...", "..."], "speaker_notes": "..."',
    },
    "title-only": {
        "instruction": 'This layout has only a title — return empty bullets.',
        "schema": '"bullets": [], "speaker_notes": "..."',
    },
    "body-text": {
        "instruction": 'Write a single flowing paragraph (3-6 sentences) in body_text — narrative prose, not a list. Return an empty bullets array.',
        "schema": '"bullets": [], "body_text": "...", "speaker_notes": "..."',
    },
    "two-col": {
        "instruction": (
            'Produce 4-6 bullets that split into two parallel groups: '
            'the first half goes to the left column, the second half to the right. '
            'Order them so adjacent pairs (bullets[0] vs bullets[half], etc.) are the comparison points.'
        ),
        "schema": '"bullets": ["...", "..."], "speaker_notes": "..."',
    },
    "image-right": {
        "instruction": 'Expand bullet_seeds into 2-4 full bullets that read alongside an image.',
        "schema": '"bullets": ["...", "..."], "speaker_notes": "..."',
    },
    "image-left": {
        "instruction": 'Expand bullet_seeds into 2-4 full bullets that read alongside an image.',
        "schema": '"bullets": ["...", "..."], "speaker_notes": "..."',
    },
    "full-image": {
        "instruction": (
            'Write a short caption (under 15 words) labeling the image. '
            'Return an empty bullets array — this layout shows only the image and caption.'
        ),
        "schema": '"bullets": [], "caption": "...", "speaker_notes": "..."',
    },
    "image-top": {
        "instruction": 'Write 1-2 short bullets (renderer only displays the first two) that frame the image above.',
        "schema": '"bullets": ["...", "..."], "speaker_notes": "..."',
    },
    "quote": {
        "instruction": (
            'Extract the quotation text into "quote" and the speaker/source into "quote_source". '
            'Both must come from the source content. Return an empty bullets array.'
        ),
        "schema": '"bullets": [], "quote": "...", "quote_source": "...", "speaker_notes": "..."',
    },
    "two-images": {
        "instruction": (
            'Produce exactly 2 bullets — bullets[0] is the caption for the left image, '
            'bullets[1] is the caption for the right image. Keep each under 12 words.'
        ),
        "schema": '"bullets": ["left caption", "right caption"], "speaker_notes": "..."',
    },
}


def draft_single_slide(
    slide_index: int,
    target_outline_slide: OutlineSlide,
    full_outline: list[OutlineSlide],
    context: str,
    text_length: str,
) -> DraftedSlide:
    text_guidance = TEXT_LENGTH_GUIDANCE.get(text_length, TEXT_LENGTH_GUIDANCE["BALANCED"])
    layout = target_outline_slide["layout"]
    layout_spec = LAYOUTS[layout]
    draft_spec = _LAYOUT_DRAFT_INSTRUCTIONS[layout]

    # lightweight summary of the full outline so the LLM knows the narrative flow
    # without eating up too many tokens.
    outline_summary = json.dumps(
        [
            {
                "slide_number": i + 1,
                "title": s["title"],
                "topics_covered": s["bullet_seeds"],
            }
            for i, s in enumerate(full_outline)
        ],
        indent=2,
    )

    target_slide_json = json.dumps(target_outline_slide, indent=2)

    prompt = f"""You are an expert presentation writer expanding a single slide from a larger outline.

CONTENT (source of truth — every claim must be grounded here):
{context}

FULL PRESENTATION OUTLINE (For context and narrative flow):
{outline_summary}

YOUR TASK: Expand Slide number {slide_index + 1}
TARGET SLIDE DETAILS:
{target_slide_json}

LAYOUT: {layout} — {layout_spec['purpose']}
TEXT LENGTH: {text_length} — {text_guidance}

For this specific slide:
- {draft_spec['instruction']}
- Write speaker_notes (2-4 sentences) the presenter would say to elaborate.

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  {draft_spec['schema']}
}}

Rules:
- Focus ONLY on the Target Slide. Do not write content meant for subsequent slides.
- Every claim must be grounded in the provided content above.
- Do NOT introduce facts, names, or numbers absent from the provided content."""

    raw = _call_llm_json(prompt, max_tokens=1500)

    drafted: DraftedSlide = {
        "order_index": slide_index,
        "title": target_outline_slide.get("title", f"Slide {slide_index + 1}")[:255],
        "layout": layout,
        "bullets": list(raw.get("bullets", []) or []),
        "speaker_notes": raw.get("speaker_notes", ""),
        "image_queries": target_outline_slide.get("image_queries", []),
    }
    if "body_text" in raw:
        drafted["body_text"] = raw.get("body_text", "") or ""
    if "quote" in raw:
        drafted["quote"] = raw.get("quote", "") or ""
    if "quote_source" in raw:
        drafted["quote_source"] = raw.get("quote_source", "") or ""
    if "caption" in raw:
        drafted["caption"] = raw.get("caption", "") or ""
    return drafted

# ── Stage 2b: images ─────────────────────────────────────────────────────────

def _fetch_one_image(query: str) -> dict:
    """Fetch a single image, never raising — see services/images.py, image
    fetching is best-effort and a slide with a placeholder beats a failed deck."""
    from .images import fallback_image, fetch_wikimedia_image

    try:
        return fetch_wikimedia_image(query) or fallback_image(query)
    except Exception:
        logger.exception("Wikimedia fetch failed for query=%r", query)
        return fallback_image(query)


def _fetch_outline_images(outline: list[OutlineSlide]) -> list[list[dict]]:
    """Resolve every image the outline asks for, returning one list per slide.

    Queries are deduped so a phrase two slides both want costs one Wikimedia
    call. Depends only on the outline, which is what lets this run alongside
    slide drafting rather than after it.
    """
    flat_queries: list[tuple[int, str]] = [
        (i, q)
        for i, s in enumerate(outline)
        for q in s.get("image_queries", [])
    ]
    per_slide_images: list[list[dict]] = [[] for _ in outline]
    if not flat_queries:
        return per_slide_images

    unique_queries = list({q for _, q in flat_queries})
    with concurrent.futures.ThreadPoolExecutor(max_workers=_MAX_IMAGE_WORKERS) as pool:
        fetched = dict(zip(unique_queries, pool.map(_fetch_one_image, unique_queries)))

    for slide_idx, query in flat_queries:
        img = fetched[query]
        per_slide_images[slide_idx].append({
            "query": query,
            "url": img["url"],
            "attribution": img["attribution"],
            "source_page": img["source_page"],
        })
    return per_slide_images


# ── Orchestrator ─────────────────────────────────────────────────────────────

def generate_presentation_from_rag(
    notebook_id: str,
    user_id: str,
    topic: str,
    topic_id: str | None,
    custom_prompt: str,
    slide_count: int,
    text_length: str,
) -> GeneratedPresentation:
    """
    Full pipeline: retrieve RAG chunks -> outline -> draft slides.
    Raises InsufficientContextError if no chunks are retrieved.
    """
    from rag.services import query_notebook_rag, query_notebook_rag_by_topic

    if topic_id:
        chunks = asyncio.run(
            query_notebook_rag_by_topic(notebook_id, user_id, topic, topic_id, k=max(8, slide_count * 3))
        )
    else:
        chunks = asyncio.run(
            query_notebook_rag(notebook_id, user_id, topic or "overview")
        )

    if not chunks:
        raise InsufficientContextError(
            "Not enough information in your lecture materials to generate this presentation. "
            "Try uploading more files or selecting a different topic."
        )

    context = "\n\n---\n\n".join(doc.page_content for doc in chunks)

    # Step 1: Generate the full outline (LLM also picks a polished deck title)
    deck_title, outline = generate_outline(topic, custom_prompt, slide_count, text_length, context)

    drafted_slides: list[DraftedSlide | None] = [None] * len(outline)  # Pre-allocate list to maintain correct slide order

    # Step 2: Draft slides and fetch images concurrently. The image queries come
    # out of the outline and never depend on the drafted text, so fetching them
    # on a side thread takes Wikimedia off the critical path entirely instead of
    # tacking it onto the end (it has a 6s timeout and retries — a slow run used
    # to be added straight to the user's wait).
    with concurrent.futures.ThreadPoolExecutor(
        max_workers=1, thread_name_prefix="pres-images"
    ) as image_executor:
        images_future = image_executor.submit(_fetch_outline_images, outline)

        draft_workers = max(1, min(len(outline), _MAX_DRAFT_WORKERS))
        with concurrent.futures.ThreadPoolExecutor(max_workers=draft_workers) as executor:
            futures = {
                executor.submit(
                    draft_single_slide,
                    i,
                    slide,
                    outline,
                    context,
                    text_length
                ): i
                for i, slide in enumerate(outline)
            }

            # As each task finishes, place it in the correct index
            for future in concurrent.futures.as_completed(futures):
                original_index = futures[future]
                try:
                    drafted_slides[original_index] = future.result()
                except Exception as e:
                    # Handle potential LLM failures gracefully for individual slides
                    logger.exception(f"Error generating slide {original_index}: {e}")
                    drafted_slides[original_index] = {
                        "order_index": original_index,
                        "title": outline[original_index].get("title", "Error generating slide"),
                        "layout": outline[original_index].get("layout", "bullets"),
                        "bullets": ["Failed to generate content. Please retry."],
                        "speaker_notes": "",
                        "image_queries": outline[original_index].get("image_queries", [])
                    }

        per_slide_images = images_future.result()

    for i, slide in enumerate(drafted_slides):
        if slide is not None:
            slide["images"] = per_slide_images[i]

    # Narrow the optional list to a list of DraftedSlide for return
    final_slides: list[DraftedSlide] = [s for s in drafted_slides if s is not None]
    return {"title": deck_title, "slides": final_slides}


# ── Per-slide refinement ─────────────────────────────────────────────────────

def refine_slide(
    slide: dict,
    feedback: str,
    presentation_title: str,
    neighbor_slides: list[dict],
) -> dict:
    """
    Single Claude call to apply user feedback to one slide. Receives the slide's
    current state (including any layout-specific fields) plus its neighbours for
    context, and returns the updated slide. image_queries are preserved from the
    input — if the user wants to change images they use the manual edit endpoint.

    The LLM may change the layout, so the returned dict always carries all
    layout-specific fields. Fields irrelevant to the new layout are blanked so
    stale content from the previous layout doesn't leak through.
    """
    layout_schema_lines = "\n".join(
        f"  - {name}: return {spec['schema']}"
        for name, spec in _LAYOUT_DRAFT_INSTRUCTIONS.items()
    )

    neighbours_summary = json.dumps(
        [{"order_index": n.get("order_index"), "title": n.get("title", ""), "bullets": n.get("bullets", [])}
         for n in neighbor_slides],
        indent=2,
    )
    current_summary = json.dumps({
        "title": slide.get("title", ""),
        "layout": slide.get("layout", "bullets"),
        "bullets": slide.get("bullets", []),
        "body_text": slide.get("body_text", ""),
        "quote": slide.get("quote", ""),
        "quote_source": slide.get("quote_source", ""),
        "caption": slide.get("caption", ""),
        "speaker_notes": slide.get("speaker_notes", ""),
    }, indent=2)

    prompt = f"""You are revising a single slide in a presentation based on user feedback.

PRESENTATION TITLE: {presentation_title}

NEIGHBOURING SLIDES (for context — do not duplicate their content):
{neighbours_summary}

CURRENT SLIDE:
{current_summary}

USER FEEDBACK:
{feedback}

Apply the feedback. Keep the slide focused and self-contained. You may change the layout if the feedback warrants it. Allowed layouts and the fields each one expects:
{layout_schema_lines}

Always return "title", "layout", and "speaker_notes". For the chosen layout, return ONLY the body fields listed above for that layout — omit fields belonging to other layouts.

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "title": "...",
  "layout": "...",
  ...layout-specific fields...,
  "speaker_notes": "..."
}}"""

    raw = _call_llm_json(prompt, max_tokens=2048, temperature=0.5)

    layout = raw.get("layout") or slide.get("layout", "bullets")
    if layout not in LAYOUTS:
        layout = slide.get("layout", "bullets")
    if layout not in LAYOUTS:
        layout = "bullets"

    return {
        "title": (raw.get("title") or slide.get("title", ""))[:255],
        "layout": layout,
        "bullets": list(raw.get("bullets", []) or []),
        "body_text": raw.get("body_text", "") or "",
        "quote": raw.get("quote", "") or "",
        "quote_source": (raw.get("quote_source", "") or "")[:255],
        "caption": (raw.get("caption", "") or "")[:500],
        "speaker_notes": raw.get("speaker_notes", "") or "",
    }
