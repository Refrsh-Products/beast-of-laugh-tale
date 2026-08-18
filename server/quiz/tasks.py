"""Celery task for asynchronous quiz generation.

Mirrors ``presentation/tasks.py``: the view creates a QUEUED ``QuizSession`` row
and enqueues this task, which flips the row to GENERATING, runs the (blocking)
RAG-retrieval + LLM generation, and persists the questions — flipping to
COMPLETED, or FAILED with an ``error_message`` on any error. Clients poll the
detail endpoint for the ``generation_status`` transition.
"""

import logging
from datetime import date

from celery import shared_task
from django.db import transaction

from accounts.models import Account, DailyUsage
from .errors import QuizContentUnavailableError, QuizGenerationError
from .models import QuizSession, QuizQuestion, QuizGenerationStatus
from .services.quiz_generation import (
    generate_quiz_from_rag,
    generate_quiz_from_entire_notebook,
)

logger = logging.getLogger(__name__)

ALL_TOPICS = "All Topics"


@shared_task(bind=True)
def generate_quiz_task(self, quiz_id: str, topic_id: str | None = None):
    # Idempotent claim: only (re-)adopt a non-terminal row. Celery is at-least-once,
    # so a redelivered/retried task can re-enter here — if the row already reached
    # COMPLETED or FAILED, do nothing. This is what stops a duplicate run from
    # regenerating the quiz or issuing a second quota refund. (Re-adopting an already
    # GENERATING row covers the case where a previous run crashed mid-generation.)
    claimed = (
        QuizSession.objects.filter(
            id=quiz_id,
            generation_status__in=[
                QuizGenerationStatus.QUEUED,
                QuizGenerationStatus.GENERATING,
            ],
        ).update(generation_status=QuizGenerationStatus.GENERATING)
    )
    if not claimed:
        logger.info("Quiz %s already terminal; skipping duplicate run", quiz_id)
        return

    quiz = QuizSession.objects.select_related("notebook").get(id=quiz_id)

    notebook_id = str(quiz.notebook_id)  # type: ignore[attr-defined]
    user_id = str(quiz.notebook.user_id)  # type: ignore[attr-defined]

    try:
        if quiz.topic == ALL_TOPICS:
            generated = generate_quiz_from_entire_notebook(
                notebook_id=notebook_id,
                user_id=user_id,
                num_questions=quiz.num_questions,
                difficulty=quiz.difficulty,
            )
        else:
            generated = generate_quiz_from_rag(
                topic=quiz.topic,
                topic_id=topic_id,
                notebook_id=notebook_id,
                user_id=user_id,
                num_questions=quiz.num_questions,
                difficulty=quiz.difficulty,
            )

        with transaction.atomic():
            quiz.title = generated["title"][:255]
            quiz.generation_status = QuizGenerationStatus.COMPLETED
            quiz.save(update_fields=["title", "generation_status"])
            QuizQuestion.objects.bulk_create([
                QuizQuestion(quiz=quiz, **q) for q in generated["questions"]
            ])

    except (QuizContentUnavailableError, QuizGenerationError) as exc:
        # Expected, user-facing failures — record the reason and stop (no re-raise).
        # The user never received a quiz, so hand the daily slot back.
        message = _error_message(exc)
        _mark_failed_and_refund(quiz_id, message)
        logger.info("Quiz %s generation failed: %s", quiz_id, message)

    except Exception:
        _mark_failed_and_refund(
            quiz_id, "Quiz generation failed unexpectedly. Please try again."
        )
        logger.exception("Quiz %s generation failed", quiz_id)
        raise


def _mark_failed_and_refund(quiz_id: str, message: str) -> None:
    """Flip GENERATING → FAILED and refund the daily quiz slot, idempotently.

    The conditional UPDATE's rowcount is the idempotency token: only the call that
    actually performs the GENERATING → FAILED transition refunds. A duplicate or
    retried task that finds the row already FAILED (or COMPLETED) gets rowcount 0
    and refunds nothing, so the slot can never be handed back twice.
    """
    with transaction.atomic():
        flipped = QuizSession.objects.filter(
            id=quiz_id, generation_status=QuizGenerationStatus.GENERATING
        ).update(
            generation_status=QuizGenerationStatus.FAILED, error_message=message
        )
        if not flipped:
            return
        _refund_quiz_slot(quiz_id)


def _refund_quiz_slot(quiz_id: str) -> None:
    """Give back one ``DailyUsage.quizzes_generated`` for the quiz's owner.

    Must be called inside an open transaction (see ``_mark_failed_and_refund``) so
    the counter read-modify-write is serialized against concurrent quiz creation
    via ``select_for_update``. Mirrors the ``date.today()`` bucket the increment
    used in ``create_quiz_session``. No-ops if there is nothing to refund.
    """
    quiz = QuizSession.objects.select_related("notebook").get(id=quiz_id)
    account = (
        Account.objects.select_for_update()
        .filter(user_id=quiz.notebook.user_id)  # type: ignore[attr-defined]
        .first()
    )
    if account is None:
        return
    usage = (
        DailyUsage.objects.select_for_update()
        .filter(account=account, date=date.today())
        .first()
    )
    if usage and usage.quizzes_generated > 0:
        usage.quizzes_generated -= 1
        usage.save(update_fields=["quizzes_generated"])


def _error_message(exc) -> str:
    """Pull the human-readable message out of the APIException detail dict."""
    detail = getattr(exc, "detail", None)
    if isinstance(detail, dict) and "message" in detail:
        return str(detail["message"])
    return str(detail) if detail else "Quiz generation failed."
