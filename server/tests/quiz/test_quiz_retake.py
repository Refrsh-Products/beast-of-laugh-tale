"""Coverage for POST /api/v1/quizzes/<id>/retake/.

Retake creates a fresh copy of a quiz. Two contract details this pins:

  * source_session root resolution — ``root_id = source.source_session_id or
    source.id``. Retaking a retake links the new session to the *root* original,
    not the immediate parent, so the retake chain stays flat (one level deep).
  * questions are copied from that root, fresh (no user_answer / is_correct).

No LLM/RAG — retake copies persisted rows, so no mock fixtures needed.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from notebooks.models import Notebook
from tests.factories import QuizSessionFactory, QuizQuestionFactory
from quiz.models import QuizSession, QuizQuestion, QuizStatus


def retake_url(quiz):
    return reverse("quiz:quiz-retake", kwargs={"quiz_id": quiz.id})


def make_quiz_with_questions(notebook, n=2, **kwargs):
    quiz = QuizSessionFactory(notebook=notebook, num_questions=n, **kwargs)
    for i in range(n):
        QuizQuestionFactory(
            quiz=quiz, order_index=i, question_text=f"Root Q{i}", correct_answer="A"
        )
    return quiz


# ── Copy + linkage ───────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_retake_copies_questions_and_links_to_source(authenticated_client, notebook):
    """
    Given: a completed original quiz with 2 questions
    When:  retake is requested
    Then:  201, a new IN_PROGRESS session linked to the original via
           source_session, with the questions copied fresh (no answers) and a
           "_copy" title.
    """
    original = make_quiz_with_questions(
        notebook, n=2, title="Cell Biology", status=QuizStatus.COMPLETED
    )

    response = authenticated_client.post(retake_url(original), format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.content
    body = response.json()

    new_session = QuizSession.objects.get(id=body["id"])
    assert new_session.id != original.id
    assert new_session.source_session_id == original.id
    assert new_session.title == "Cell Biology_copy"
    assert new_session.topic == original.topic
    assert new_session.difficulty == original.difficulty
    assert new_session.num_questions == original.num_questions
    assert new_session.status == QuizStatus.IN_PROGRESS  # fresh, not completed

    new_questions = QuizQuestion.objects.filter(quiz=new_session).order_by("order_index")
    assert [q.question_text for q in new_questions] == ["Root Q0", "Root Q1"]
    # Copied clean — no carried-over answers or results.
    assert all(q.user_answer is None and q.is_correct is None for q in new_questions)


@pytest.mark.django_db
def test_retake_of_retake_resolves_to_root(authenticated_client, notebook):
    """
    Given: an original (root) and a first retake pointing at it
    When:  the *retake* is itself retaken
    Then:  the new session links back to the ROOT, not the intermediate retake —
           the chain stays one level deep — and questions still come from the
           root.
    """
    root = make_quiz_with_questions(root_notebook := notebook, n=2, title="Root")
    first_retake = QuizSessionFactory(
        notebook=notebook, num_questions=2, title="Root_copy", source_session=root
    )
    # Give the first retake its own copied questions (as the real flow would).
    for i in range(2):
        QuizQuestionFactory(quiz=first_retake, order_index=i, question_text=f"Root Q{i}", correct_answer="A")

    response = authenticated_client.post(retake_url(first_retake), format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.content
    new_session = QuizSession.objects.get(id=response.json()["id"])
    # Points at the root, NOT first_retake.
    assert new_session.source_session_id == root.id
    assert new_session.source_session_id != first_retake.id

    new_questions = QuizQuestion.objects.filter(quiz=new_session).order_by("order_index")
    assert [q.question_text for q in new_questions] == ["Root Q0", "Root Q1"]


# ── Archived notebook ────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_retake_archived_notebook_rejected(authenticated_client, user):
    """Retake writes to the notebook, so an archived notebook is rejected (403)."""
    archived = Notebook.objects.create(user=user, title="Archived", is_archived=True)
    original = make_quiz_with_questions(archived, n=2)

    before = QuizSession.objects.count()
    response = authenticated_client.post(retake_url(original), format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["code"] == "notebook_archived"
    assert QuizSession.objects.count() == before  # no copy created


# ── Authorization ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_retake_requires_authentication(api_client, notebook):
    original = make_quiz_with_questions(notebook, n=2)
    response = api_client.post(retake_url(original), format="json")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_cannot_retake_another_users_quiz(authenticated_client, django_user_model):
    other = django_user_model.objects.create_user(email="other@example.com", password="x")
    other_notebook = Notebook.objects.create(user=other, title="Not yours")
    original = make_quiz_with_questions(other_notebook, n=2)

    response = authenticated_client.post(retake_url(original), format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND
