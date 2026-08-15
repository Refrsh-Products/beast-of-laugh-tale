"""
Quiz-session creation orchestration.

This is the persistence/business-logic half of quiz creation, deliberately kept
separate from the LLM generation in ``quiz_generation.py`` (which only produces
plain question dicts) and from the DRF view (which only handles HTTP).

``create_quiz_session`` takes plain primitives — no request, no serializer — and:
  1. Picks the generation strategy: whole-notebook when no topic is given
     ("All Topics"), otherwise topic-scoped RAG retrieval.
  2. Inside a single transaction, enforces the daily quiz quota, persists the
     ``QuizSession`` + its ``QuizQuestion`` rows, increments daily usage, and
     touches notebook activity.

Keeping this free of DRF means it can be unit-tested directly with a notebook and
user, and mirrors the thin-view / logic-in-``services`` convention used by
``notebooks/services``.
"""

from datetime import date

from django.db import transaction

from accounts.models import Account, DailyUsage
from accounts.services import quota
from notebooks.errors import DailyQuizQuotaExceededError
from notebooks.models import Notebook
from notebooks.services.activity import touch_notebook_activity

from ..models import QuizSession, QuizQuestion
from .quiz_generation import generate_quiz_from_rag, generate_quiz_from_entire_notebook

ALL_TOPICS = "All Topics"


def _is_all_topics(topic: str, topic_id) -> bool:
    return not topic_id and (not topic or topic.strip() == "" or topic == ALL_TOPICS)


def create_quiz_session(
    *,
    notebook: Notebook,
    user,
    topic: str,
    topic_id,
    num_questions: int,
    difficulty: str,
    quiz_type=None,
    time_limit=None,
) -> QuizSession:
    """Generate a quiz and persist it (with quota enforcement) for ``notebook``.

    Raises ``DailyQuizQuotaExceededError`` if the account is over its daily quiz
    quota. ``quiz_type`` falls back to the model default when None.
    """
    if _is_all_topics(topic, topic_id):
        final_topic = ALL_TOPICS
        generated = generate_quiz_from_entire_notebook(
            notebook_id=str(notebook.pk),
            user_id=str(user.pk),
            num_questions=num_questions,
            difficulty=difficulty,
        )
    else:
        final_topic = topic
        generated = generate_quiz_from_rag(
            topic=topic,
            topic_id=str(topic_id) if topic_id else None,
            notebook_id=str(notebook.pk),
            user_id=str(user.pk),
            num_questions=num_questions,
            difficulty=difficulty,
        )

    with transaction.atomic():
        account = Account.objects.select_for_update().get(user=user)
        usage, _ = DailyUsage.objects.select_for_update().get_or_create(
            account=account, date=date.today()
        )
        if not quota.check_daily_quiz_quota(account):
            plan = quota.get_effective_plan(account)
            limits = quota.get_limits(plan)
            raise DailyQuizQuotaExceededError(limit=limits["max_quizzes_per_day"])

        create_kwargs = {
            "notebook": notebook,
            "title": generated["title"],
            "topic": final_topic,
            "num_questions": num_questions,
            "difficulty": difficulty,
            "time_limit": time_limit,
        }
        if quiz_type is not None:
            create_kwargs["quiz_type"] = quiz_type

        quiz = QuizSession.objects.create(**create_kwargs)
        QuizQuestion.objects.bulk_create([
            QuizQuestion(quiz=quiz, **q) for q in generated["questions"]
        ])

        usage.quizzes_generated += 1
        usage.save()

        touch_notebook_activity(notebook_id=notebook.pk)

    return quiz
