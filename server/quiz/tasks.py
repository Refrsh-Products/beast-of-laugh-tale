"""Celery task for asynchronous quiz generation.

Mirrors ``presentation/tasks.py``: the view creates a QUEUED ``QuizSession`` row
and enqueues this task, which flips the row to GENERATING, runs the (blocking)
RAG-retrieval + LLM generation, and persists the questions — flipping to
COMPLETED, or FAILED with an ``error_message`` on any error. Clients poll the
detail endpoint for the ``generation_status`` transition.
"""

import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

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
    quiz = QuizSession.objects.select_related("notebook").get(id=quiz_id)
    quiz.generation_status = QuizGenerationStatus.GENERATING
    quiz.save(update_fields=["generation_status"])

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
        message = _error_message(exc)
        QuizSession.objects.filter(id=quiz_id).update(
            generation_status=QuizGenerationStatus.FAILED,
            error_message=message,
        )
        logger.info("Quiz %s generation failed: %s", quiz_id, message)

    except Exception:
        QuizSession.objects.filter(id=quiz_id).update(
            generation_status=QuizGenerationStatus.FAILED,
            error_message="Quiz generation failed unexpectedly. Please try again.",
        )
        logger.exception("Quiz %s generation failed", quiz_id)
        raise


def _error_message(exc) -> str:
    """Pull the human-readable message out of the APIException detail dict."""
    detail = getattr(exc, "detail", None)
    if isinstance(detail, dict) and "message" in detail:
        return str(detail["message"])
    return str(detail) if detail else "Quiz generation failed."
