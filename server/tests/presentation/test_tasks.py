"""Quota-refund behaviour of ``generate_presentation_task`` (FRE-130).

The lifetime presentation slot is consumed at create time
(``PresentationCreateView`` increments ``Account.presentations_generated`` before
enqueue). When generation ends in FAILED the user never received a deck, so the
task must hand the slot back — and, because Celery is at-least-once, hand it back
exactly once no matter how many times a duplicate/retried task re-runs.

The task is driven eagerly via ``.apply()``; ``generate_presentation_from_rag`` is
patched to force success or a specific failure branch.
"""

from unittest.mock import patch

import pytest

from accounts.models import Account
from notebooks.models import Notebook
from presentation.models import Presentation, PresentationSlide, PresentationStatus
from presentation.services.generation import InsufficientContextError
from presentation.tasks import generate_presentation_task


def queued_presentation(notebook):
    return Presentation.objects.create(
        notebook=notebook,
        title="Generating: Photosynthesis",
        topic="Photosynthesis",
        slide_count=4,
        status=PresentationStatus.QUEUED,
    )


def run_task(presentation, topic_id=None):
    return generate_presentation_task.apply(args=[str(presentation.id), topic_id])


def _gen_payload():
    return {
        "title": "Photosynthesis",
        "slides": [
            {"order_index": 0, "layout": "bullets", "title": "Intro", "bullets": ["a"]},
        ],
    }


@pytest.fixture
def notebook(db, user):
    return Notebook.objects.create(user=user, title="Test Notebook")


@pytest.mark.django_db
def test_failed_generation_refunds_slot(notebook):
    """An InsufficientContextError (user-facing) hands the lifetime slot back."""
    account = Account.objects.create(user=notebook.user, presentations_generated=1)
    pres = queued_presentation(notebook)

    with patch(
        "presentation.tasks.generate_presentation_from_rag",
        side_effect=InsufficientContextError("no content"),
    ):
        run_task(pres)

    pres.refresh_from_db()
    account.refresh_from_db()
    assert pres.status == PresentationStatus.FAILED
    assert account.presentations_generated == 0


@pytest.mark.django_db
def test_unexpected_failure_refunds_slot(notebook):
    """The re-raising ``except Exception`` path still refunds before re-raising."""
    account = Account.objects.create(user=notebook.user, presentations_generated=1)
    pres = queued_presentation(notebook)

    with patch(
        "presentation.tasks.generate_presentation_from_rag",
        side_effect=RuntimeError("boom"),
    ):
        result = run_task(pres)
        with pytest.raises(RuntimeError):
            result.get()

    account.refresh_from_db()
    assert account.presentations_generated == 0


@pytest.mark.django_db
def test_duplicate_failed_run_refunds_only_once(notebook):
    """A redelivered task whose row is already FAILED must not refund twice.

    Starts at 2 so a broken guard lands on 0 while the correct single refund lands
    on 1 — the two outcomes are distinguishable.
    """
    account = Account.objects.create(user=notebook.user, presentations_generated=2)
    pres = queued_presentation(notebook)

    with patch(
        "presentation.tasks.generate_presentation_from_rag",
        side_effect=InsufficientContextError("no content"),
    ):
        run_task(pres)  # first run: FAILED, refunds 2 → 1
        run_task(pres)  # redelivery: row already terminal → no refund

    account.refresh_from_db()
    assert account.presentations_generated == 1


@pytest.mark.django_db
def test_successful_generation_does_not_refund(notebook):
    """A completed deck keeps the slot it consumed — refund is failure-only."""
    account = Account.objects.create(user=notebook.user, presentations_generated=1)
    pres = queued_presentation(notebook)

    with patch(
        "presentation.tasks.generate_presentation_from_rag",
        return_value=_gen_payload(),
    ):
        run_task(pres)

    pres.refresh_from_db()
    account.refresh_from_db()
    assert pres.status == PresentationStatus.COMPLETED
    assert account.presentations_generated == 1
    assert PresentationSlide.objects.filter(presentation=pres).count() == 1
