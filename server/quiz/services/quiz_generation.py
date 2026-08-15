"""
Quiz generation service.

generate_quiz_from_rag() retrieves relevant chunks from the vector store for
the selected topic, then asks Claude Haiku to produce quiz questions grounded
in that content. generate_quiz_from_entire_notebook() does the same across all
of a notebook's topics with a proportional question distribution.

These fail loudly rather than falling back to placeholder content: no indexed
content raises QuizContentUnavailableError (422); an LLM failure raises
QuizGenerationError (503). See quiz/errors.py.
"""

import os
import json
import asyncio
import logging
from typing import TypedDict

from anthropic import Anthropic
from anthropic.types import TextBlock

from ..errors import QuizContentUnavailableError, QuizGenerationError

logger = logging.getLogger(__name__)


class QuestionData(TypedDict):
    question_text: str
    question_type: str   # 'MCQ' | 'TRUE_FALSE'
    choices: list[str]   # empty list for TRUE_FALSE
    correct_answer: str
    explanation: str
    order_index: int


class GeneratedQuiz(TypedDict):
    title: str
    questions: list[QuestionData]


# ── Real generation ──────────────────────────────────────────────────────────

def generate_quiz_from_rag(
    topic: str,
    topic_id: str | None,
    notebook_id: str,
    user_id: str,
    num_questions: int,
    difficulty: str,
) -> GeneratedQuiz:
    """
    Retrieve relevant chunks for the topic, then generate quiz questions
    grounded in that content via Claude Haiku.
    """
    from rag.services import query_notebook_rag_by_topic, query_notebook_rag

    # Retrieve chunks (sync wrapper around async retrieval)
    if topic_id:
        chunks = asyncio.run(
            query_notebook_rag_by_topic(notebook_id, user_id, topic, topic_id)
        )
    else:
        chunks = asyncio.run(
            query_notebook_rag(notebook_id, user_id, topic)
        )

    if not chunks:
        raise QuizContentUnavailableError(topic=topic or None)

    context = "\n\n---\n\n".join(doc.page_content for doc in chunks)
    return _call_llm_for_quiz(topic, num_questions, difficulty, context)


def _call_llm_for_quiz(
    topic: str,
    num_questions: int,
    difficulty: str,
    context: str,
) -> GeneratedQuiz:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    difficulty_guidance = {
        "EASY": "factual recall — ask about definitions, key terms, and straightforward facts",
        "MEDIUM": "comprehension and application — ask about how/why, comparisons, and applying concepts",
        "HARD": "analysis and synthesis — ask about implications, edge cases, and multi-step reasoning",
    }.get(difficulty, "comprehension")

    prompt = f"""You are an expert quiz creator for university-level lecture notes.

TOPIC: {topic}
DIFFICULTY: {difficulty} ({difficulty_guidance})
NUMBER OF QUESTIONS: {num_questions}

LECTURE CONTENT:
{context}

Generate exactly {num_questions} quiz questions based strictly on the lecture content above.
Mix MCQ and TRUE_FALSE question types naturally (aim for roughly 70% MCQ, 30% TRUE_FALSE).

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{{
  "title": "A concise quiz title based on the topic (max 60 chars)",
  "questions": [
    {{
      "question_text": "...",
      "question_type": "MCQ",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation of why this is correct"
    }},
    {{
      "question_text": "...",
      "question_type": "TRUE_FALSE",
      "choices": [],
      "correct_answer": "True",
      "explanation": "Brief explanation"
    }}
  ]
}}

Rules:
- MCQ: exactly 4 choices, correct_answer must be the full text of one of the choices
- TRUE_FALSE: choices must be an empty list [], correct_answer must be exactly "True" or "False"
- Base every question on the provided content only
- Do not repeat questions"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=4096,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        block = response.content[0]
        if not isinstance(block, TextBlock):
            raise ValueError("LLM returned non-text response")

        text = block.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # remove opening ```json
            text = text.rsplit("```", 1)[0]  # remove closing ```
            text = text.strip()

        raw = json.loads(text)
        questions: list[QuestionData] = []
        for i, q in enumerate(raw.get("questions", [])[:num_questions]):
            questions.append({
                "question_text": q["question_text"],
                "question_type": q["question_type"],
                "choices": q.get("choices", []),
                "correct_answer": q["correct_answer"],
                "explanation": q.get("explanation", ""),
                "order_index": i,
            })

        return {"title": raw.get("title", f"Quiz: {topic}"), "questions": questions}

    except Exception as e:
        logger.exception("LLM quiz generation failed (topic=%s)", topic)
        raise QuizGenerationError() from e


# ── Full-notebook generation ──────────────────────────────────────────────────

def generate_quiz_from_entire_notebook(
    notebook_id: str,
    user_id: str,
    num_questions: int,
    difficulty: str,
) -> GeneratedQuiz:
    """
    Generate a quiz covering all topics in the notebook proportionally.
    Retrieves chunks per topic from pgvector, then calls Claude Haiku with a
    single prompt that includes the question distribution as instructions.
    """
    from rag.models import NotebookTopic
    from rag.services import query_notebook_rag_by_topic

    topics = list(NotebookTopic.objects.filter(notebook_id=notebook_id).order_by("created_at"))

    if not topics:
        raise QuizContentUnavailableError()

    # Proportional distribution — pure math, no LLM needed
    num_topics = len(topics)
    base = num_questions // num_topics
    remainder = num_questions % num_topics
    questions_per_topic = [base + (1 if i < remainder else 0) for i in range(num_topics)]

    topic_contexts: list[str] = []
    topics_distribution: list[dict] = []

    for i, topic in enumerate(topics):
        q_count = questions_per_topic[i]
        retrieval_k = max(3, q_count * 3)
        chunks = asyncio.run(
            query_notebook_rag_by_topic(notebook_id, user_id, topic.name, str(topic.pk), k=retrieval_k)
        )
        if chunks:
            context_block = f"=== {topic.name} ===\n" + "\n\n---\n\n".join(
                doc.page_content for doc in chunks
            )
            topic_contexts.append(context_block)
            topics_distribution.append({"name": topic.name, "count": q_count})

    if not topic_contexts:
        raise QuizContentUnavailableError()

    effective_num_questions = sum(d["count"] for d in topics_distribution)
    full_context = "\n\n".join(topic_contexts)
    return _call_llm_for_quiz_full_notebook(topics_distribution, effective_num_questions, difficulty, full_context)


def _call_llm_for_quiz_full_notebook(
    topics_distribution: list[dict],
    num_questions: int,
    difficulty: str,
    context: str,
) -> GeneratedQuiz:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    difficulty_guidance = {
        "EASY": "factual recall — ask about definitions, key terms, and straightforward facts",
        "MEDIUM": "comprehension and application — ask about how/why, comparisons, and applying concepts",
        "HARD": "analysis and synthesis — ask about implications, edge cases, and multi-step reasoning",
    }.get(difficulty, "comprehension")

    distribution_lines = "\n".join(
        f"  - {d['name']}: {d['count']} question{'s' if d['count'] != 1 else ''}"
        for d in topics_distribution
    )

    prompt = f"""You are an expert quiz creator for university-level lecture notes.

DIFFICULTY: {difficulty} ({difficulty_guidance})
TOTAL QUESTIONS: {num_questions}

QUESTION DISTRIBUTION (follow this exactly):
{distribution_lines}

LECTURE CONTENT (organised by topic with === headers):
{context}

Generate exactly {num_questions} quiz questions distributed as specified above.
Mix MCQ and TRUE_FALSE question types naturally within each topic (aim for roughly 70% MCQ, 30% TRUE_FALSE).
Each question must be grounded in the lecture content provided under its corresponding === topic header.

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{{
  "title": "Complete Notebook Quiz ({difficulty.capitalize()})",
  "questions": [
    {{
      "question_text": "...",
      "question_type": "MCQ",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation of why this is correct"
    }},
    {{
      "question_text": "...",
      "question_type": "TRUE_FALSE",
      "choices": [],
      "correct_answer": "True",
      "explanation": "Brief explanation"
    }}
  ]
}}

Rules:
- MCQ: exactly 4 choices, correct_answer must be the full text of one of the choices
- TRUE_FALSE: choices must be an empty list [], correct_answer must be exactly "True" or "False"
- Base every question strictly on the provided content only
- Do not repeat questions
- Follow the topic distribution counts exactly"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8096,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        block = response.content[0]
        if not isinstance(block, TextBlock):
            raise ValueError("LLM returned non-text response")

        text = block.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # remove opening ```json
            text = text.rsplit("```", 1)[0]  # remove closing ```
            text = text.strip()

        raw = json.loads(text)
        questions: list[QuestionData] = []
        for i, q in enumerate(raw.get("questions", [])[:num_questions]):
            questions.append({
                "question_text": q["question_text"],
                "question_type": q["question_type"],
                "choices": q.get("choices", []),
                "correct_answer": q["correct_answer"],
                "explanation": q.get("explanation", ""),
                "order_index": i,
            })

        return {"title": raw.get("title", f"Complete Notebook Quiz ({difficulty.capitalize()})"), "questions": questions}

    except Exception as e:
        logger.exception("Full-notebook LLM quiz generation failed")
        raise QuizGenerationError() from e
