"""
Quiz-session creation orchestration.

This is the persistence/business-logic half of quiz creation, deliberately kept
separate from the LLM generation in ``quiz_generation.py`` (which only produces
plain question dicts) and from the DRF view (which only handles HTTP).

``create_quiz_session`` takes plain primitives — no request, no serializer — and,
inside a single transaction, enforces the daily quiz quota, creates a QUEUED
``QuizSession`` row, increments daily usage, and touches notebook activity. It
does **not** generate the questions — that's the async ``generate_quiz_task``,
which the view enqueues after this commits. It returns ``(quiz, topic_id)`` so
the view has what the task needs.

Enforcing the quota here (before enqueue) means an over-quota request never
reaches the LLM — the old synchronous path generated first and checked quota
after, burning tokens for requests it then rejected.

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

from ..models import QuizSession, QuizGenerationStatus

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
) -> tuple[QuizSession, str | None]:
    """Create a QUEUED quiz session (with quota enforcement) for ``notebook``.

    Returns ``(quiz, topic_id)``. The caller enqueues ``generate_quiz_task`` with
    these after the transaction commits so the worker can read the row. Raises
    ``DailyQuizQuotaExceededError`` if the account is over its daily quiz quota.
    ``quiz_type`` falls back to the model default when None.
    """
    final_topic = ALL_TOPICS if _is_all_topics(topic, topic_id) else topic
    normalized_topic_id = str(topic_id) if topic_id else None

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
            "title": f"Generating: {final_topic}"[:255],
            "topic": final_topic,
            "num_questions": num_questions,
            "difficulty": difficulty,
            "time_limit": time_limit,
            "generation_status": QuizGenerationStatus.QUEUED,
        }
        if quiz_type is not None:
            create_kwargs["quiz_type"] = quiz_type

        quiz = QuizSession.objects.create(**create_kwargs)

        usage.quizzes_generated += 1
        usage.save()

        touch_notebook_activity(notebook_id=notebook.pk)

    return quiz, normalized_topic_id
