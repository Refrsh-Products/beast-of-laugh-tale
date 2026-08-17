"""Coverage for POST /api/v1/quizzes/<id>/submit/.

Submit scores the answers, flags each question, and marks the session COMPLETED.
No LLM/RAG involved — these run against quizzes built directly with the
factories, so no mock fixtures are needed.

Note the scoring contract being pinned: score = correct / quiz.num_questions,
i.e. the denominator is the *requested* question count, not the number of
questions present or answered.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories import QuizSessionFactory, QuizQuestionFactory
from quiz.models import QuizStatus


def submit_url(quiz):
    return reverse("quiz:quiz-submit", kwargs={"quiz_id": quiz.id})


def make_quiz(notebook, num_questions=2, **kwargs):
    """A fresh (IN_PROGRESS) quiz with `num_questions` MCQ questions whose
    correct answer is always "A"."""
    quiz = QuizSessionFactory(notebook=notebook, num_questions=num_questions, **kwargs)
    questions = [
        QuizQuestionFactory(quiz=quiz, order_index=i, correct_answer="A")
        for i in range(num_questions)
    ]
    return quiz, questions


def answers_payload(pairs):
    return {"answers": [{"question_id": str(qid), "user_answer": ans} for qid, ans in pairs]}


# ── Scoring ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_submit_scores_completes_and_flags_questions(authenticated_client, notebook):
    """
    Given: a 2-question quiz, one answered right and one wrong
    When:  the answers are submitted
    Then:  200, score 0.5, status COMPLETED with completed_at set, and each
           question carries its user_answer + is_correct flag.
    """
    quiz, (q0, q1) = make_quiz(notebook, num_questions=2)

    response = authenticated_client.post(
        submit_url(quiz),
        answers_payload([(q0.id, "A"), (q1.id, "B")]),  # right, wrong
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.content
    body = response.json()
    assert body["score"] == 0.5
    assert body["status"] == QuizStatus.COMPLETED

    quiz.refresh_from_db()
    assert quiz.status == QuizStatus.COMPLETED
    assert quiz.completed_at is not None

    q0.refresh_from_db(); q1.refresh_from_db()
    assert q0.user_answer == "A" and q0.is_correct is True
    assert q1.user_answer == "B" and q1.is_correct is False


@pytest.mark.django_db
def test_all_correct_scores_one(authenticated_client, notebook):
    quiz, (q0, q1) = make_quiz(notebook, num_questions=2)
    response = authenticated_client.post(
        submit_url(quiz), answers_payload([(q0.id, "A"), (q1.id, "A")]), format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["score"] == 1.0


@pytest.mark.django_db
def test_score_denominator_is_num_questions_not_answered_count(authenticated_client, notebook):
    """
    Given: a quiz that claims num_questions=4 but only has 2 real questions,
           both answered correctly
    When:  submitted
    Then:  score = 2/4 = 0.5 — the denominator is the requested count. This pins
           the current (arguably surprising) formula so the refactor can't change
           it silently.
    """
    # num_questions=4 but only 2 real questions exist — build it explicitly so
    # the counts diverge.
    quiz = QuizSessionFactory(notebook=notebook, num_questions=4)
    q0 = QuizQuestionFactory(quiz=quiz, order_index=0, correct_answer="A")
    q1 = QuizQuestionFactory(quiz=quiz, order_index=1, correct_answer="A")

    response = authenticated_client.post(
        submit_url(quiz), answers_payload([(q0.id, "A"), (q1.id, "A")]), format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["score"] == 0.5


@pytest.mark.django_db
def test_unknown_question_ids_are_ignored(authenticated_client, notebook):
    """
    Given: the payload includes an answer for a question that isn't on this quiz
    When:  submitted
    Then:  the stray answer is skipped (no error), scoring counts only real ones.
    """
    import uuid
    quiz, (q0, q1) = make_quiz(notebook, num_questions=2)
    response = authenticated_client.post(
        submit_url(quiz),
        answers_payload([(q0.id, "A"), (uuid.uuid4(), "A")]),  # one real, one stray
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["score"] == 0.5  # 1 correct / 2 num_questions


# ── Double submit ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_double_submit_rejected(authenticated_client, notebook):
    """A quiz already COMPLETED cannot be submitted again."""
    quiz, (q0, q1) = make_quiz(notebook, num_questions=2, status=QuizStatus.COMPLETED)
    response = authenticated_client.post(
        submit_url(quiz), answers_payload([(q0.id, "A"), (q1.id, "A")]), format="json"
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already been submitted" in response.json()["detail"]


# ── Validation ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_empty_answers_rejected(authenticated_client, notebook):
    quiz, _ = make_quiz(notebook, num_questions=2)
    response = authenticated_client.post(submit_url(quiz), {"answers": []}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "answers" in response.json()


# ── Authorization ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_submit_requires_authentication(api_client, notebook):
    quiz, (q0, _) = make_quiz(notebook, num_questions=2)
    response = api_client.post(submit_url(quiz), answers_payload([(q0.id, "A")]), format="json")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_cannot_submit_another_users_quiz(authenticated_client, django_user_model):
    """A quiz under another user's notebook is not found (ownership scoping)."""
    from notebooks.models import Notebook
    other = django_user_model.objects.create_user(email="other@example.com", password="x")
    other_notebook = Notebook.objects.create(user=other, title="Not yours")
    quiz, (q0, _) = make_quiz(other_notebook, num_questions=2)

    response = authenticated_client.post(
        submit_url(quiz), answers_payload([(q0.id, "A")]), format="json"
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
