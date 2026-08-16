"""Shared fixtures for the quiz test suite.

Quiz generation runs **inline in the POST request** (unlike presentation, whose
generation is a Celery task), so these tests can't just stub a task — they have
to mock the two things generation actually reaches out to:

  * RAG retrieval — ``rag.services.query_notebook_rag`` /
    ``query_notebook_rag_by_topic``. Both are ``async`` and invoked via
    ``asyncio.run(...)`` inside the service, so the mocks are ``AsyncMock``
    (a plain MagicMock would hand ``asyncio.run`` a non-coroutine and blow up).
    They're imported *inside* the function bodies from ``rag.services``, so we
    patch them at that source module.
  * The Anthropic client — ``quiz.services.quiz_generation.Anthropic``. The
    service does ``isinstance(block, TextBlock)`` on the response, so the fake
    reply must carry a *real* ``anthropic.types.TextBlock`` or generation would
    raise ``QuizGenerationError`` and every happy-path test would fail.
"""

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anthropic.types import TextBlock

from accounts.models import Account
from notebooks.models import Notebook
from rag.models import NotebookTopic


@pytest.fixture
def account(db, user):
    """Quiz creation does ``Account.objects.select_for_update().get(user=user)``
    for quota enforcement — without an Account the create path 500s."""
    return Account.objects.create(user=user)


@pytest.fixture
def notebook(db, user):
    return Notebook.objects.create(user=user, title="Test Notebook")


@pytest.fixture
def notebook_topics(db, notebook):
    """Two topics for the "All Topics" (whole-notebook) generation branch.

    ``generate_quiz_from_entire_notebook`` reads only ``.name``/``.pk``, but the
    ``embedding`` column is a non-null 3072-dim vector, so we supply a zero
    placeholder just to satisfy the DB.
    """
    zero_vec = [0.0] * 3072
    return [
        NotebookTopic.objects.create(notebook=notebook, name="Photosynthesis", embedding=zero_vec),
        NotebookTopic.objects.create(notebook=notebook, name="Cellular Respiration", embedding=zero_vec),
    ]


# ── RAG retrieval mock ───────────────────────────────────────────────────────

def make_chunk(text):
    """A stand-in for a LangChain ``Document`` — the service only touches
    ``.page_content``."""
    return SimpleNamespace(page_content=text)


@pytest.fixture
def mock_rag_retrieval():
    """Patch both async retrieval functions to return canned chunks.

    Yields a ``SimpleNamespace`` with the two ``AsyncMock``s (``by_topic`` and
    ``all``) so a test can assert call args or swap in ``return_value=[]`` to
    exercise the content-unavailable path.
    """
    chunks = [make_chunk("Chlorophyll absorbs light."), make_chunk("ATP stores energy.")]
    by_topic = AsyncMock(return_value=chunks)
    plain = AsyncMock(return_value=chunks)
    with patch("rag.services.query_notebook_rag_by_topic", by_topic), \
         patch("rag.services.query_notebook_rag", plain):
        yield SimpleNamespace(by_topic=by_topic, all=plain, chunks=chunks)


# ── Anthropic client mock ────────────────────────────────────────────────────

def _default_payload():
    """A minimal but rule-valid quiz: one MCQ + one TRUE_FALSE."""
    return {
        "title": "Test Quiz",
        "questions": [
            {
                "question_text": "What pigment absorbs light in photosynthesis?",
                "question_type": "MCQ",
                "choices": ["Chlorophyll", "Keratin", "Hemoglobin", "Melanin"],
                "correct_answer": "Chlorophyll",
                "explanation": "Chlorophyll is the primary light-absorbing pigment.",
            },
            {
                "question_text": "ATP stores energy.",
                "question_type": "TRUE_FALSE",
                "choices": [],
                "correct_answer": "True",
                "explanation": "ATP is the cell's energy currency.",
            },
        ],
    }


def _make_message(text):
    """Wrap raw text in the response shape the service reads: ``.content[0]`` is
    a real ``TextBlock`` (the service isinstance-checks it)."""
    block = TextBlock(type="text", text=text, citations=None)
    return SimpleNamespace(content=[block])


class FakeAnthropic:
    """Handle for tuning the mocked LLM inside a single test."""

    def __init__(self, create_mock):
        self.create = create_mock

    def set_payload(self, payload):
        """Return this dict (JSON-encoded) as the LLM reply."""
        self.create.side_effect = None
        self.create.return_value = _make_message(json.dumps(payload))

    def set_raw_text(self, text):
        """Return arbitrary raw text — for malformed-JSON / fenced-output cases."""
        self.create.side_effect = None
        self.create.return_value = _make_message(text)

    def raise_error(self, exc=None):
        """Make the LLM call blow up — exercises the QuizGenerationError path."""
        self.create.side_effect = exc or RuntimeError("LLM unavailable")


@pytest.fixture
def mock_anthropic():
    """Patch ``Anthropic`` in the quiz generation module.

    Defaults to a valid two-question quiz. Yields a :class:`FakeAnthropic` so a
    test can call ``.set_payload(...)``, ``.set_raw_text(...)`` or
    ``.raise_error()`` to shape one response.
    """
    create_mock = MagicMock(return_value=_make_message(json.dumps(_default_payload())))
    client = MagicMock()
    client.messages.create = create_mock
    with patch("quiz.services.quiz_generation.Anthropic", return_value=client):
        yield FakeAnthropic(create_mock)
