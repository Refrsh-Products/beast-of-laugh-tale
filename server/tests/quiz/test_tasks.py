"""Coverage for the async generation task ``generate_quiz_task``.

This is where the generation behaviour that used to run inline at create time now
lives: RAG retrieval → LLM → questions, plus the failure handling that flips the
row to FAILED with an error_message (rather than leaving it stuck in GENERATING).

The task is driven synchronously via ``.apply()`` (eager), which handles the
bound ``self``. RAG/Anthropic are mocked via conftest's ``mock_rag_retrieval`` /
``mock_anthropic``.
"""

from unittest.mock import patch

import pytest

from tests.factories import QuizSessionFactory
from quiz.tasks import generate_quiz_task
from quiz.models import QuizSession, QuizQuestion, QuizGenerationStatus


def queued_quiz(notebook, topic, num_questions=5):
    return QuizSessionFactory(
        notebook=notebook,
        topic=topic,
        num_questions=num_questions,
        generation_status=QuizGenerationStatus.QUEUED,
        title="Generating: ...",
    )


def run_task(quiz, topic_id=None):
    """Run the task eagerly; returns the EagerResult (call .get() to re-raise)."""
    return generate_quiz_task.apply(args=[str(quiz.id), topic_id])


# ── Success ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_single_topic_populates_questions_and_completes(
    notebook, mock_rag_retrieval, mock_anthropic
):
    """
    Given: a QUEUED single-topic quiz
    When:  the task runs
    Then:  COMPLETED, title taken from the LLM payload, questions persisted, and
           the topic-scoped retrieval path used (not whole-notebook).
    """
    quiz = queued_quiz(notebook, topic="Photosynthesis")

    run_task(quiz)

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.COMPLETED
    assert quiz.title == "Test Quiz"  # from the mocked payload
    assert quiz.error_message == ""
    assert QuizQuestion.objects.filter(quiz=quiz).count() == 2

    assert mock_rag_retrieval.all.await_count == 1
    assert mock_rag_retrieval.by_topic.await_count == 0


@pytest.mark.django_db
def test_topic_id_routes_to_topic_scoped_retrieval(
    notebook, notebook_topics, mock_rag_retrieval, mock_anthropic
):
    """A topic_id argument drives the by_topic retrieval path."""
    topic = notebook_topics[0]
    quiz = queued_quiz(notebook, topic=topic.name)

    run_task(quiz, topic_id=str(topic.pk))

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.COMPLETED
    assert mock_rag_retrieval.by_topic.await_count == 1
    assert mock_rag_retrieval.all.await_count == 0


@pytest.mark.django_db
def test_all_topics_fans_out_over_topics_and_completes(
    notebook, notebook_topics, mock_rag_retrieval, mock_anthropic
):
    """An "All Topics" quiz retrieves once per notebook topic, then completes."""
    quiz = queued_quiz(notebook, topic="All Topics", num_questions=6)

    run_task(quiz)

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.COMPLETED
    assert mock_rag_retrieval.by_topic.await_count == len(notebook_topics)


# ── Failure: content unavailable (expected, no re-raise) ─────────────────────

@pytest.mark.django_db
def test_single_topic_no_chunks_marks_failed(
    notebook, mock_rag_retrieval, mock_anthropic
):
    """
    Given: retrieval finds no chunks
    When:  the task runs
    Then:  FAILED with a user-facing error_message, no questions, and the LLM is
           never called — an empty context is knowable-bad, don't spend tokens.
    """
    mock_rag_retrieval.all.return_value = []
    quiz = queued_quiz(notebook, topic="Photosynthesis")

    run_task(quiz)  # swallowed — no re-raise for expected failures

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.FAILED
    assert quiz.error_message  # non-empty
    assert not QuizQuestion.objects.filter(quiz=quiz).exists()
    mock_anthropic.create.assert_not_called()


@pytest.mark.django_db
def test_all_topics_no_topics_marks_failed(
    notebook, mock_rag_retrieval, mock_anthropic
):
    """An "All Topics" quiz on a notebook with no indexed topics fails cleanly
    (no topics → no context), without calling the LLM."""
    quiz = queued_quiz(notebook, topic="All Topics")

    run_task(quiz)

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.FAILED
    assert quiz.error_message
    mock_anthropic.create.assert_not_called()


# ── Failure: LLM error (expected, no re-raise) ───────────────────────────────

@pytest.mark.django_db
def test_llm_error_marks_failed(notebook, mock_rag_retrieval, mock_anthropic):
    """A generation-service failure (wrapped as QuizGenerationError) marks the
    row FAILED and does not re-raise."""
    mock_anthropic.raise_error()
    quiz = queued_quiz(notebook, topic="Photosynthesis")

    run_task(quiz)

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.FAILED
    assert quiz.error_message
    assert not QuizQuestion.objects.filter(quiz=quiz).exists()


# ── Failure: unexpected error (re-raised, but row not left stuck) ────────────

@pytest.mark.django_db
def test_unexpected_error_marks_failed_and_reraises(notebook):
    """
    An unexpected (non-APIException) error must still flip the row to FAILED —
    never leave it stuck in GENERATING — while re-raising so Celery records the
    failure.
    """
    quiz = queued_quiz(notebook, topic="Photosynthesis")

    with patch("quiz.tasks.generate_quiz_from_rag", side_effect=RuntimeError("boom")):
        result = run_task(quiz)
        with pytest.raises(RuntimeError):
            result.get()

    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.FAILED
    assert quiz.error_message


# ── Status transition ────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_task_sets_generating_before_work(notebook):
    """
    The row should be flipped to GENERATING as the task starts, so a client
    polling mid-flight sees GENERATING rather than a stale QUEUED. Snapshotted at
    the generation-service boundary (which the task calls from its sync body).
    """
    quiz = queued_quiz(notebook, topic="Photosynthesis")
    seen = {}

    def capture(*_args, **_kwargs):
        seen["status"] = QuizSession.objects.get(id=quiz.id).generation_status
        return {"title": "Done", "questions": []}

    with patch("quiz.tasks.generate_quiz_from_rag", side_effect=capture):
        run_task(quiz)

    assert seen["status"] == QuizGenerationStatus.GENERATING
    quiz.refresh_from_db()
    assert quiz.generation_status == QuizGenerationStatus.COMPLETED
