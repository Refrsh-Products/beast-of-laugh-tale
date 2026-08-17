"""The presentation pipeline's concurrency and image resilience (FRE-133).

Three properties this pins down, none of which had coverage before:

  * **Image failures stay local.** ``fetch_wikimedia_image`` swallows network
    errors itself, but an *unexpected* exception out of its parsing code used to
    surface from ``dict(zip(..., pool.map(...)))`` in the Celery task, escape
    into the task's generic ``except Exception`` and fail the whole deck over
    one bad image record. Each query now degrades to a placeholder on its own.
  * **Images are fetched alongside slide drafting**, not after it. Proven by
    making each side block until the other has started — if they ever go back to
    running in sequence, the waits time out and these tests fail rather than
    just getting slower.
  * **Drafting is concurrent but bounded.** More than the old flat 5 run at
    once, never more than ``_MAX_DRAFT_WORKERS``, and slides come back in
    outline order regardless of the order the drafts finish in.

The waits here are deterministic handshakes on ``threading.Event``, not sleeps
tuned to a machine — the timeouts exist only so a regression fails loudly
instead of hanging.
"""

import threading
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from presentation.services.generation import (
    _MAX_DRAFT_WORKERS,
    _fetch_outline_images,
    generate_presentation_from_rag,
    InsufficientContextError,
)
from presentation.services.images import FALLBACK_IMAGE_URL


# Long enough that a loaded CI box never trips it, short enough that a genuine
# regression (the two phases serialised again) fails in seconds.
HANDSHAKE_TIMEOUT = 10

# Used where drafts deliberately hold their worker slot to let concurrency build
# up. Fires instantly when the cap allows it, so this bounds only the regression
# case — where it is paid once per wave.
SATURATION_TIMEOUT = 2


def outline_slide(index, layout="image-right", queries=None):
    """One outline slide. ``queries`` defaults to a single query named after the
    slide so per-slide grouping is unambiguous in assertions."""
    if queries is None:
        queries = [f"query {index}"]
    return {
        "order_index": index,
        "title": f"Slide {index}",
        "layout": layout,
        "bullet_seeds": [f"seed {index}"],
        "image_queries": queries,
    }


def wikimedia_hit(query):
    """The shape ``fetch_wikimedia_image`` returns on success."""
    return {
        "url": f"https://upload.wikimedia.org/{query}.jpg",
        "attribution": "Some Author (CC BY-SA 4.0)",
        "source_page": f"https://commons.wikimedia.org/wiki/{query}",
    }


def drafted(index, slide):
    """The shape ``draft_single_slide`` returns."""
    return {
        "order_index": index,
        "title": slide["title"],
        "layout": slide["layout"],
        "bullets": [f"bullet for {slide['title']}"],
        "speaker_notes": "",
        "image_queries": slide["image_queries"],
    }


def is_placeholder(image):
    return image["url"] == FALLBACK_IMAGE_URL


@pytest.fixture
def mock_rag():
    """Both retrieval functions are async and reached via ``asyncio.run``, so the
    mocks must be AsyncMock — a MagicMock hands ``asyncio.run`` a non-coroutine.
    Patched at ``rag.services`` because the orchestrator imports them in-body."""
    chunks = [SimpleNamespace(page_content="Chlorophyll absorbs light.")]
    by_topic, plain = AsyncMock(return_value=chunks), AsyncMock(return_value=chunks)
    with patch("rag.services.query_notebook_rag_by_topic", by_topic), \
         patch("rag.services.query_notebook_rag", plain):
        yield SimpleNamespace(by_topic=by_topic, plain=plain, chunks=chunks)


def run_pipeline(slide_count=4, topic_id=None):
    return generate_presentation_from_rag(
        notebook_id="nb-1",
        user_id="u-1",
        topic="Photosynthesis",
        topic_id=topic_id,
        custom_prompt="",
        slide_count=slide_count,
        text_length="BALANCED",
    )


# ---------------------------------------------------------------------------
# Image failures stay local to the query that failed
# ---------------------------------------------------------------------------

def test_every_query_resolving_gives_every_slide_its_real_image():
    """
    Given:  an outline where all 7 image queries hit on Wikimedia
    When:   the images are resolved
    Then:   all 7 come back real, grouped one per slide, no placeholders
    """
    outline = [outline_slide(i) for i in range(7)]

    with patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        per_slide = _fetch_outline_images(outline)

    assert [len(imgs) for imgs in per_slide] == [1] * 7
    flat = [img for imgs in per_slide for img in imgs]
    assert not any(is_placeholder(img) for img in flat)
    # each slide got the image for *its* query, not another slide's
    assert [imgs[0]["query"] for imgs in per_slide] == [f"query {i}" for i in range(7)]


def test_a_query_with_no_results_only_placeholders_its_own_slot():
    """
    Given:  2 of 7 queries find nothing on Wikimedia (the function returns None)
    When:   the images are resolved
    Then:   those 2 slots get placeholders and the other 5 keep their real image
    """
    outline = [outline_slide(i) for i in range(7)]
    missing = {"query 2", "query 5"}

    def fetch(query):
        return None if query in missing else wikimedia_hit(query)

    with patch("presentation.services.images.fetch_wikimedia_image", fetch):
        per_slide = _fetch_outline_images(outline)

    flat = [img for imgs in per_slide for img in imgs]
    assert {img["query"] for img in flat if is_placeholder(img)} == missing
    assert sum(1 for img in flat if not is_placeholder(img)) == 5


def test_an_unexpected_error_on_one_query_does_not_lose_the_other_images():
    """
    Given:  2 of 7 queries raise an error ``images.py`` does not catch — e.g.
            AttributeError from a Wikimedia record whose extmetadata value
            isn't a dict (images.py:142-148)
    When:   the images are resolved
    Then:   only those 2 degrade to placeholders. This is the regression guard:
            the same raise used to propagate out of the Celery task and mark the
            entire presentation FAILED.
    """
    outline = [outline_slide(i) for i in range(7)]
    broken = {"query 2", "query 5"}

    def fetch(query):
        if query in broken:
            raise AttributeError("'str' object has no attribute 'get'")
        return wikimedia_hit(query)

    with patch("presentation.services.images.fetch_wikimedia_image", fetch):
        per_slide = _fetch_outline_images(outline)

    flat = [img for imgs in per_slide for img in imgs]
    assert {img["query"] for img in flat if is_placeholder(img)} == broken
    assert sum(1 for img in flat if not is_placeholder(img)) == 5


def test_wikimedia_being_entirely_down_still_returns_a_full_set_of_slots():
    """
    Given:  every query raises — Wikimedia unreachable
    When:   the images are resolved
    Then:   no exception escapes, and every slide still gets its slot filled
            with a placeholder so image-bearing layouts render
    """
    outline = [outline_slide(i) for i in range(7)]

    def fetch(query):
        raise OSError("connection refused")

    with patch("presentation.services.images.fetch_wikimedia_image", fetch):
        per_slide = _fetch_outline_images(outline)

    flat = [img for imgs in per_slide for img in imgs]
    assert len(flat) == 7
    assert all(is_placeholder(img) for img in flat)


# ---------------------------------------------------------------------------
# Query grouping and deduplication
# ---------------------------------------------------------------------------

def test_a_phrase_two_slides_both_want_is_fetched_once_and_given_to_both():
    """
    Given:  two slides asking for the same image phrase
    When:   the images are resolved
    Then:   Wikimedia is hit once for it, and both slides still get the image
    """
    outline = [
        outline_slide(0, queries=["shared phrase"]),
        outline_slide(1, queries=["shared phrase"]),
        outline_slide(2, queries=["distinct phrase"]),
    ]
    calls = []

    def fetch(query):
        calls.append(query)
        return wikimedia_hit(query)

    with patch("presentation.services.images.fetch_wikimedia_image", fetch):
        per_slide = _fetch_outline_images(outline)

    assert sorted(calls) == ["distinct phrase", "shared phrase"]
    assert per_slide[0][0]["url"] == per_slide[1][0]["url"]
    assert [len(imgs) for imgs in per_slide] == [1, 1, 1]


def test_slots_match_each_layouts_image_count():
    """
    Given:  a mix of layouts — two-images wants 2, image-right 1, bullets 0
    When:   the images are resolved
    Then:   each slide gets exactly as many entries as its layout renders, in
            the order the outline asked for them
    """
    outline = [
        outline_slide(0, layout="two-images", queries=["left pic", "right pic"]),
        outline_slide(1, layout="image-right", queries=["single pic"]),
        outline_slide(2, layout="bullets", queries=[]),
    ]

    with patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        per_slide = _fetch_outline_images(outline)

    assert [len(imgs) for imgs in per_slide] == [2, 1, 0]
    assert [img["query"] for img in per_slide[0]] == ["left pic", "right pic"]


def test_an_outline_wanting_no_images_never_calls_wikimedia():
    """
    Given:  an all-text outline
    When:   the images are resolved
    Then:   empty slots, and Wikimedia is not contacted at all
    """
    outline = [outline_slide(i, layout="bullets", queries=[]) for i in range(3)]
    calls = []

    with patch("presentation.services.images.fetch_wikimedia_image", calls.append):
        per_slide = _fetch_outline_images(outline)

    assert per_slide == [[], [], []]
    assert calls == []


# ---------------------------------------------------------------------------
# Images are fetched alongside drafting, not after it
# ---------------------------------------------------------------------------

def test_image_fetch_and_slide_drafting_run_at_the_same_time(mock_rag):
    """
    Given:  a deck where both the image fetch and the slide drafts refuse to
            finish until the *other* phase has started
    When:   the pipeline runs
    Then:   it completes. Neither wait can be satisfied if the phases are
            serialised, so a return to fetch-after-draft fails this test rather
            than merely slowing the pipeline down.
    """
    outline = [outline_slide(i) for i in range(4)]
    image_started = threading.Event()
    draft_started = threading.Event()
    # Recorded, not asserted in-thread: the orchestrator catches any exception a
    # draft raises and swaps in a placeholder slide, so an assert inside the mock
    # would be swallowed and the test would pass regardless.
    image_saw_draft: list[bool] = []
    draft_saw_image: list[bool] = []

    def fetch(query):
        image_started.set()
        image_saw_draft.append(draft_started.wait(HANDSHAKE_TIMEOUT))
        return wikimedia_hit(query)

    def draft(index, slide, full_outline, context, text_length):
        draft_started.set()
        draft_saw_image.append(image_started.wait(HANDSHAKE_TIMEOUT))
        return drafted(index, slide)

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide", draft), \
         patch("presentation.services.images.fetch_wikimedia_image", fetch):
        result = run_pipeline(slide_count=len(outline))

    assert any(draft_saw_image), \
        "no draft overlapped the image fetch — images are being fetched after drafting"
    assert any(image_saw_draft), \
        "the image fetch never overlapped a draft — drafting is waiting on images"
    assert len(result["slides"]) == 4
    # Real drafts, not the orchestrator's failure placeholders
    assert all(s["bullets"] == [f"bullet for Slide {i}"] for i, s in enumerate(result["slides"]))


def test_resolved_images_are_attached_to_the_slides_the_task_persists(mock_rag):
    """
    Given:  a two-images slide, an image-right slide and a text-only slide
    When:   the pipeline runs
    Then:   each returned slide carries its own ``images`` list — this is what
            ``generate_presentation_task`` writes to PresentationSlide.images,
            so per-slide grouping has to survive the return trip
    """
    outline = [
        outline_slide(0, layout="two-images", queries=["left pic", "right pic"]),
        outline_slide(1, layout="image-right", queries=["single pic"]),
        outline_slide(2, layout="bullets", queries=[]),
    ]

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide",
               side_effect=lambda i, s, *a, **k: drafted(i, s)), \
         patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        result = run_pipeline(slide_count=len(outline))

    slides = result["slides"]
    assert [len(s["images"]) for s in slides] == [2, 1, 0]
    assert [img["query"] for img in slides[0]["images"]] == ["left pic", "right pic"]
    assert slides[1]["images"][0]["attribution"] == "Some Author (CC BY-SA 4.0)"


# ---------------------------------------------------------------------------
# Drafting concurrency: raised above the old flat 5, but still bounded
# ---------------------------------------------------------------------------

def test_more_than_five_slides_are_drafted_concurrently(mock_rag):
    """
    Given:  a 20-slide deck whose first six drafts each block until six drafts
            are in flight together
    When:   the pipeline runs
    Then:   it completes. Under the old ``max_workers=5`` the sixth draft could
            never start, so the five waiters would time out — this is the guard
            against the cap silently going back down.
    """
    outline = [outline_slide(i) for i in range(20)]
    lock = threading.Lock()
    in_flight = 0
    peak = 0
    six_in_flight = threading.Event()

    def draft(index, slide, full_outline, context, text_length):
        nonlocal in_flight, peak
        with lock:
            in_flight += 1
            peak = max(peak, in_flight)
            if in_flight >= 6:
                six_in_flight.set()
        try:
            # Hold the slot so drafts genuinely pile up rather than each finishing
            # before the next starts. Fires immediately once six are in flight; the
            # short timeout only bounds the regression case.
            six_in_flight.wait(SATURATION_TIMEOUT)
            return drafted(index, slide)
        finally:
            with lock:
                in_flight -= 1

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide", draft), \
         patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        result = run_pipeline(slide_count=len(outline))

    # Asserted on the recorded peak, not inside the thread — the orchestrator
    # swallows exceptions from a draft and substitutes a placeholder slide.
    assert peak >= 6, f"only {peak} drafts ran concurrently — the worker cap regressed"
    assert len(result["slides"]) == 20


def test_drafting_never_exceeds_the_worker_cap(mock_rag):
    """
    Given:  a 30-slide deck — the largest ``slide_count`` the serializer allows
    When:   the pipeline runs
    Then:   no more than ``_MAX_DRAFT_WORKERS`` drafts are ever in flight. The
            cap has to stay bounded: the Celery worker runs --pool=threads
            --concurrency=10, so per-task threads multiply across concurrent
            presentations.
    """
    outline = [outline_slide(i) for i in range(30)]
    lock = threading.Lock()
    in_flight = 0
    peak = 0

    def draft(index, slide, full_outline, context, text_length):
        nonlocal in_flight, peak
        with lock:
            in_flight += 1
            peak = max(peak, in_flight)
        try:
            return drafted(index, slide)
        finally:
            with lock:
                in_flight -= 1

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide", draft), \
         patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        result = run_pipeline(slide_count=len(outline))

    assert len(result["slides"]) == 30
    assert peak <= _MAX_DRAFT_WORKERS


def test_slides_come_back_in_outline_order_however_the_drafts_finish(mock_rag):
    """
    Given:  drafts that complete in reverse order (later slides return first)
    When:   the pipeline runs
    Then:   the deck is still in outline order — the orchestrator consumes
            futures as they complete, so it has to place each result by index
            rather than by arrival
    """
    # Sized to the cap so every draft is in flight together whatever the cap is —
    # the reverse chain below needs all of them alive at once, and hardcoding a
    # size would make this test fail for the unrelated reason of a lowered cap.
    slide_count = _MAX_DRAFT_WORKERS
    outline = [outline_slide(i) for i in range(slide_count)]
    release = [threading.Event() for _ in outline]
    release[-1].set()  # the last slide goes first, then each unblocks its predecessor
    completion_order: list[int] = []

    def draft(index, slide, full_outline, context, text_length):
        release[index].wait(HANDSHAKE_TIMEOUT)
        completion_order.append(index)
        if index > 0:
            release[index - 1].set()
        return drafted(index, slide)

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide", draft), \
         patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        result = run_pipeline(slide_count=len(outline))

    # The drafts really did finish back-to-front, so ordering is being restored
    # rather than just happening to come out right.
    assert completion_order == list(reversed(range(slide_count)))
    slides = result["slides"]
    assert [s["order_index"] for s in slides] == list(range(slide_count))
    # bullets, not titles — a failure placeholder reuses the outline title, so
    # only the drafted body proves each slot holds its own slide's content
    assert [s["bullets"] for s in slides] == [[f"bullet for Slide {i}"] for i in range(slide_count)]
    # images must follow the slide they belong to, not the completion order
    assert [s["images"][0]["query"] for s in slides] == [f"query {i}" for i in range(slide_count)]


def test_one_slide_failing_to_draft_leaves_the_rest_of_the_deck_intact(mock_rag):
    """
    Given:  the draft call for slide 2 raises
    When:   the pipeline runs
    Then:   slide 2 becomes a retry-prompt placeholder in the right position and
            every other slide keeps its content — including its images
    """
    outline = [outline_slide(i) for i in range(5)]

    def draft(index, slide, full_outline, context, text_length):
        if index == 2:
            raise RuntimeError("LLM returned malformed JSON")
        return drafted(index, slide)

    with patch("presentation.services.generation.generate_outline",
               return_value=("Deck Title", outline)), \
         patch("presentation.services.generation.draft_single_slide", draft), \
         patch("presentation.services.images.fetch_wikimedia_image", wikimedia_hit):
        result = run_pipeline(slide_count=len(outline))

    slides = result["slides"]
    assert [s["order_index"] for s in slides] == [0, 1, 2, 3, 4]
    assert slides[2]["bullets"] == ["Failed to generate content. Please retry."]
    assert slides[2]["images"][0]["query"] == "query 2"
    assert slides[3]["bullets"] == ["bullet for Slide 3"]


# ---------------------------------------------------------------------------
# Retrieval still gates the pipeline
# ---------------------------------------------------------------------------

def test_no_retrieved_chunks_raises_before_any_llm_or_wikimedia_call():
    """
    Given:  a notebook with nothing indexed for the topic
    When:   the pipeline runs
    Then:   InsufficientContextError, and neither the outline LLM nor Wikimedia
            is called — the task turns this into a user-facing FAILED message
    """
    calls = []

    with patch("rag.services.query_notebook_rag", AsyncMock(return_value=[])), \
         patch("presentation.services.generation.generate_outline", calls.append), \
         patch("presentation.services.images.fetch_wikimedia_image", calls.append):
        with pytest.raises(InsufficientContextError):
            run_pipeline()

    assert calls == []
