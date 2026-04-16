"""
Quiz generation service.

generate_quiz_from_rag() retrieves relevant chunks from the vector store for
the selected topic, then asks Claude Haiku to produce quiz questions grounded
in that content.

generate_quiz_mock() is kept as a fallback for local development / tests.
"""

import os
import json
import asyncio
from typing import TypedDict

from anthropic import Anthropic
from anthropic.types import TextBlock


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
        return generate_quiz_mock(topic, num_questions, difficulty)

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

        raw = json.loads(block.text.strip())
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
        print(f"LLM quiz generation failed: {e}, falling back to mock")
        return generate_quiz_mock(topic, num_questions, difficulty)


# ── Mock fallback ─────────────────────────────────────────────────────────────

def generate_quiz_mock(topic: str, num_questions: int, difficulty: str) -> GeneratedQuiz:
    """
    Return a mock quiz session title and question list.
    Used as a fallback when RAG retrieval returns no chunks.
    """
    title = f"Mock Quiz: {topic} ({difficulty.capitalize()})"

    mock_pool: list[QuestionData] = [
        {
            "question_text": "What is the powerhouse of the cell?",
            "question_type": "MCQ",
            "choices": ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
            "correct_answer": "Mitochondria",
            "explanation": "Mitochondria produce ATP through cellular respiration.",
            "order_index": 0,
        },
        {
            "question_text": "The Earth revolves around the Sun.",
            "question_type": "TRUE_FALSE",
            "choices": [],
            "correct_answer": "True",
            "explanation": "Earth orbits the Sun roughly every 365.25 days.",
            "order_index": 1,
        },
        {
            "question_text": "Which data structure uses LIFO ordering?",
            "question_type": "MCQ",
            "choices": ["Queue", "Stack", "Linked List", "Heap"],
            "correct_answer": "Stack",
            "explanation": "A stack follows Last In, First Out (LIFO) ordering.",
            "order_index": 2,
        },
        {
            "question_text": "HTTP is a stateless protocol.",
            "question_type": "TRUE_FALSE",
            "choices": [],
            "correct_answer": "True",
            "explanation": "Each HTTP request is independent; the server retains no session state by default.",
            "order_index": 3,
        },
        {
            "question_text": "Which sorting algorithm has O(n log n) average-case complexity?",
            "question_type": "MCQ",
            "choices": ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"],
            "correct_answer": "Merge Sort",
            "explanation": "Merge Sort divides the array recursively and merges in O(n log n).",
            "order_index": 4,
        },
    ]

    questions: list[QuestionData] = []
    for i in range(num_questions):
        base = mock_pool[i % len(mock_pool)].copy()
        base["order_index"] = i
        questions.append(base)

    return {"title": title, "questions": questions}
