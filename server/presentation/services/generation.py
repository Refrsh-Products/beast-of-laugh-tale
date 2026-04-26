"""
Presentation generation service.

generate_presentation_from_rag() retrieves relevant chunks from the vector
store for the selected topic, runs a two-stage Claude pipeline (outline ->
drafts), and returns a structured deck. The Celery task layer wraps this
function and persists the result.

Unlike quiz generation, this service does NOT silently fall back to mock
content on failure: empty RAG context raises InsufficientContextError, and
LLM/JSON failures bubble up so the Celery task can mark the presentation
FAILED with an appropriate error_message.
"""

import os
import json
import asyncio
from typing import TypedDict

from anthropic import Anthropic
from anthropic.types import TextBlock


MODEL = "claude-haiku-4-5-20251001"

LAYOUT_IMAGE_COUNT = {
    "title": 0,
    "content": 0,
    "quote": 0,
    "image-left": 1,
    "image-right": 1,
    "two-column": 2,
    "image-grid": 4,
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


class DraftedSlide(TypedDict):
    order_index: int
    title: str
    layout: str
    bullets: list[str]
    speaker_notes: str
    image_queries: list[str]


class GeneratedPresentation(TypedDict):
    title: str
    slides: list[DraftedSlide]


class InsufficientContextError(Exception):
    """Raised when RAG retrieval returns no usable chunks for the topic."""
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────

def _client() -> Anthropic:
    return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


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
) -> list[OutlineSlide]:
    layouts = ", ".join(LAYOUT_IMAGE_COUNT.keys())
    layout_rules = "\n".join(
        f"  - {name}: {n} image{'s' if n != 1 else ''}"
        for name, n in LAYOUT_IMAGE_COUNT.items()
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

For each slide pick a layout from: {layouts}.
Image counts per layout (the image_queries array MUST have this many entries):
{layout_rules}

Each image_query is a short search phrase (3-8 words) suitable for Wikimedia Commons. Use specific named entities, not abstract concepts. If no good image fits, use the 'content' or 'quote' layout (zero images).

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "slides": [
    {{
      "order_index": 0,
      "title": "...",
      "layout": "title",
      "bullet_seeds": ["short phrase to expand into a bullet later", "..."],
      "image_queries": []
    }},
    ...
  ]
}}

Rules:
- Exactly {slide_count} slides
- order_index is 0-based and sequential
- Every layout must be one of the listed values
- image_queries length must match the layout's image count exactly
- bullet_seeds: 2-5 short phrases per slide (these become full bullets in stage 2)"""

    raw = _call_llm_json(prompt)
    slides = raw.get("slides", [])
    if not slides:
        raise ValueError("Outline LLM returned no slides")

    cleaned: list[OutlineSlide] = []
    for i, s in enumerate(slides[:slide_count]):
        layout = s.get("layout", "content")
        if layout not in LAYOUT_IMAGE_COUNT:
            layout = "content"
        expected_imgs = LAYOUT_IMAGE_COUNT[layout]
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
    return cleaned


# ── Stage 2: draft slides ────────────────────────────────────────────────────

def draft_slides(
    outline: list[OutlineSlide],
    context: str,
    text_length: str,
) -> tuple[list[DraftedSlide], str]:
    text_guidance = TEXT_LENGTH_GUIDANCE.get(text_length, TEXT_LENGTH_GUIDANCE["BALANCED"])
    outline_summary = json.dumps(outline, indent=2)

    prompt = f"""You are expanding a presentation outline into full slide content.

LECTURE CONTENT (source of truth — every claim must be grounded here):
{context}

OUTLINE TO EXPAND:
{outline_summary}

TEXT LENGTH: {text_length} — {text_guidance}

For each slide:
- Expand bullet_seeds into 2-5 full bullets (matching the text length guidance)
- Write speaker_notes (2-4 sentences) the presenter would say to elaborate
- Keep title and layout EXACTLY as given
- Keep image_queries EXACTLY as given

Title slides (layout="title") may have 0-1 bullets (subtitle) and minimal speaker notes.

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "title": "Overall presentation title (max 80 chars, derived from the topic)",
  "slides": [
    {{
      "order_index": 0,
      "title": "...",
      "layout": "title",
      "bullets": ["..."],
      "speaker_notes": "...",
      "image_queries": []
    }},
    ...
  ]
}}

Rules:
- Slide count must equal the outline count
- Every bullet must be grounded in the lecture content above
- Do NOT introduce facts, names, or numbers absent from the lecture content"""

    raw = _call_llm_json(prompt, max_tokens=12000)
    raw_slides = raw.get("slides", [])
    if len(raw_slides) != len(outline):
        # Pad/truncate to match outline length
        raw_slides = (raw_slides + outline)[:len(outline)]  # type: ignore[list-item]

    drafted: list[DraftedSlide] = []
    for i, (outline_slide, drafted_slide) in enumerate(zip(outline, raw_slides)):
        drafted.append({
            "order_index": i,
            "title": drafted_slide.get("title", outline_slide["title"])[:255],
            "layout": outline_slide["layout"],
            "bullets": list(drafted_slide.get("bullets", []) or []),
            "speaker_notes": drafted_slide.get("speaker_notes", ""),
            "image_queries": outline_slide["image_queries"],
        })

    title = raw.get("title") or f"Presentation: {outline[0]['title'] if outline else 'Untitled'}"
    return drafted, title


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
    outline = generate_outline(topic, custom_prompt, slide_count, text_length, context)
    drafted, title = draft_slides(outline, context, text_length)
    return {"title": title, "slides": drafted}


# ── Per-slide refinement ─────────────────────────────────────────────────────

def refine_slide(
    slide: dict,
    feedback: str,
    presentation_title: str,
    neighbor_slides: list[dict],
) -> dict:
    """
    Single Claude call to apply user feedback to one slide. Receives the slide's
    current state plus its neighbours for context. Returns the updated slide
    fields (title, bullets, speaker_notes, layout). image_queries are preserved
    from the input — if the user wants to change images they use the manual
    edit endpoint.
    """
    layouts = ", ".join(LAYOUT_IMAGE_COUNT.keys())
    neighbours_summary = json.dumps(
        [{"order_index": n.get("order_index"), "title": n.get("title", ""), "bullets": n.get("bullets", [])}
         for n in neighbor_slides],
        indent=2,
    )
    current_summary = json.dumps({
        "title": slide.get("title", ""),
        "layout": slide.get("layout", "content"),
        "bullets": slide.get("bullets", []),
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

Apply the feedback. Keep the slide focused and self-contained. You may change the layout if the feedback warrants it (allowed: {layouts}).

Return ONLY a valid JSON object — no markdown, no explanation:
{{
  "title": "...",
  "layout": "...",
  "bullets": ["..."],
  "speaker_notes": "..."
}}"""

    raw = _call_llm_json(prompt, max_tokens=2048, temperature=0.5)
    layout = raw.get("layout", slide.get("layout", "content"))
    if layout not in LAYOUT_IMAGE_COUNT:
        layout = slide.get("layout", "content")
    return {
        "title": raw.get("title", slide.get("title", ""))[:255],
        "layout": layout,
        "bullets": list(raw.get("bullets", []) or []),
        "speaker_notes": raw.get("speaker_notes", ""),
    }
