import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Presentation, PresentationSlide, PresentationStatus
from .services.generation import (
    InsufficientContextError,
    generate_presentation_from_rag,
)

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

        # Images are resolved inside generate_presentation_from_rag, concurrently
        # with slide drafting, and arrive attached to each slide.
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
                    body_text=s.get("body_text", ""),
                    quote=s.get("quote", ""),
                    quote_source=s.get("quote_source", "")[:255],
                    caption=s.get("caption", "")[:500],
                    speaker_notes=s.get("speaker_notes", ""),
                    images=s.get("images", []),
                )
                for s in gen["slides"]
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
