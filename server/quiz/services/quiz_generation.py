"""
Mock quiz generation service.

Returns a hardcoded title and list of question dicts so that
perform_create can wire up the full flow before the real AI service is ready.
"""

from typing import TypedDict


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


def generate_quiz_mock(topic: str, num_questions: int, difficulty: str) -> GeneratedQuiz:
    """
    Return a mock quiz session title and question list.

    Args:
        topic:         The quiz topic supplied by the frontend.
        num_questions: How many questions were requested.
        difficulty:    'EASY' | 'MEDIUM' | 'HARD'

    Returns:
        A GeneratedQuiz dict with 'title' and 'questions'.
        If num_questions > the pool of mock questions, the pool is cycled.
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
