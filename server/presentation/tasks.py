import logging
from concurrent.futures import ThreadPoolExecutor

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Presentation, PresentationSlide, PresentationStatus
from .services.generation import (
    InsufficientContextError,
    generate_presentation_from_rag,
)
from .services.images import fetch_wikimedia_image

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_presentation_task(self, presentation_id: str, topic_id: str | None = None):
    presentation = Presentation.objects.select_related("notebook").get(id=presentation_id)
    presentation.status = PresentationStatus.GENERATING
    presentation.save(update_fields=["status"])

    try:
        gen = generate_presentation_from_rag(
            notebook_id=str(presentation.notebook_id),  # type: ignore[attr-defined]
            user_id=str(presentation.notebook.user_id),  # type: ignore[attr-defined]
            topic=presentation.topic,
            topic_id=topic_id,
            custom_prompt=presentation.custom_prompt,
            slide_count=presentation.slide_count,
            text_length=presentation.text_length,
        )

        # Flatten image queries across slides, fetch in parallel, regroup per slide
        flat_queries: list[tuple[int, str]] = [
            (i, q)
            for i, s in enumerate(gen["slides"])
            for q in s.get("image_queries", [])
        ]
        per_slide_images: list[list[dict]] = [[] for _ in gen["slides"]]

        if flat_queries:
            with ThreadPoolExecutor(max_workers=6) as pool:
                results = list(pool.map(fetch_wikimedia_image, [q for _, q in flat_queries]))
            for (slide_idx, query), result in zip(flat_queries, results):
                if result:
                    per_slide_images[slide_idx].append({
                        "query": query,
                        "url": result["url"],
                        "attribution": result["attribution"],
                        "source_page": result["source_page"],
                    })

        with transaction.atomic():
            presentation.title = gen["title"][:255]
            presentation.status = PresentationStatus.COMPLETED
            presentation.completed_at = timezone.now()
            presentation.save(update_fields=["title", "status", "completed_at"])
            PresentationSlide.objects.bulk_create([
                PresentationSlide(
                    presentation=presentation,
                    order_index=s["order_index"],
                    layout=s["layout"],
                    title=s.get("title", "")[:255],
                    bullets=s.get("bullets", []),
                    speaker_notes=s.get("speaker_notes", ""),
                    images=per_slide_images[i],
                )
                for i, s in enumerate(gen["slides"])
            ])

    except InsufficientContextError as exc:
        # Expected user-facing condition — record and stop, do not re-raise
        Presentation.objects.filter(id=presentation_id).update(
            status=PresentationStatus.FAILED,
            error_message=str(exc),
        )
        logger.info("Presentation %s failed: insufficient context", presentation_id)

    except Exception:
        Presentation.objects.filter(id=presentation_id).update(
            status=PresentationStatus.FAILED,
            error_message="Generation failed unexpectedly. Please try again.",
        )
        logger.exception("Presentation %s generation failed", presentation_id)
        raise
