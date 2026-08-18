import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from accounts.models import Account
from .models import Presentation, PresentationSlide, PresentationStatus
from .services.generation import (
    InsufficientContextError,
    generate_presentation_from_rag,
)

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_presentation_task(self, presentation_id: str, topic_id: str | None = None):
    # Idempotent claim: only (re-)adopt a non-terminal row. Celery is at-least-once,
    # so a redelivered/retried task can re-enter here — if the row already reached
    # COMPLETED or FAILED, do nothing. This is what stops a duplicate run from
    # regenerating the deck or issuing a second quota refund. (Re-adopting an already
    # GENERATING row covers the case where a previous run crashed mid-generation.)
    claimed = (
        Presentation.objects.filter(
            id=presentation_id,
            status__in=[PresentationStatus.QUEUED, PresentationStatus.GENERATING],
        ).update(status=PresentationStatus.GENERATING)
    )
    if not claimed:
        logger.info(
            "Presentation %s already terminal; skipping duplicate run", presentation_id
        )
        return

    presentation = Presentation.objects.select_related("notebook").get(id=presentation_id)

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
        # Expected user-facing condition — record and stop, do not re-raise.
        # The user never received a deck, so hand the generation slot back.
        _mark_failed_and_refund(presentation_id, str(exc))
        logger.info("Presentation %s failed: insufficient context", presentation_id)

    except Exception:
        _mark_failed_and_refund(
            presentation_id, "Generation failed unexpectedly. Please try again."
        )
        logger.exception("Presentation %s generation failed", presentation_id)
        raise


def _mark_failed_and_refund(presentation_id: str, message: str) -> None:
    """Flip GENERATING → FAILED and refund the presentation slot, idempotently.

    The conditional UPDATE's rowcount is the idempotency token: only the call that
    actually performs the GENERATING → FAILED transition refunds. A duplicate or
    retried task that finds the row already FAILED (or COMPLETED) gets rowcount 0
    and refunds nothing, so the slot can never be handed back twice.
    """
    with transaction.atomic():
        flipped = Presentation.objects.filter(
            id=presentation_id, status=PresentationStatus.GENERATING
        ).update(status=PresentationStatus.FAILED, error_message=message)
        if not flipped:
            return
        _refund_presentation_slot(presentation_id)


def _refund_presentation_slot(presentation_id: str) -> None:
    """Give back one lifetime ``Account.presentations_generated`` for the owner.

    Must be called inside an open transaction (see ``_mark_failed_and_refund``) so
    the counter read-modify-write is serialized against concurrent presentation
    creation via ``select_for_update``. No-ops if there is nothing to refund.
    """
    presentation = Presentation.objects.select_related("notebook").get(id=presentation_id)
    account = (
        Account.objects.select_for_update()
        .filter(user_id=presentation.notebook.user_id)  # type: ignore[attr-defined]
        .first()
    )
    if account and account.presentations_generated > 0:
        account.presentations_generated -= 1
        account.save(update_fields=["presentations_generated"])
