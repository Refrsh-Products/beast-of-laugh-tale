from rest_framework import status
from rest_framework.exceptions import APIException


class QuizErrorCode:
    NO_CONTENT = "quiz_no_content"
    GENERATION_FAILED = "quiz_generation_failed"


class QuizContentUnavailableError(APIException):
    """Raised when there is no indexed content to build a quiz from.

    Happens when RAG retrieval returns no chunks, or the notebook has no topics
    indexed yet (e.g. documents still ingesting, or none uploaded). Client-actionable,
    so 422 rather than a 5xx.
    """
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = QuizErrorCode.NO_CONTENT

    def __init__(self, topic: str | None = None):
        detail = {
            "code": self.default_code,
            "message": (
                "There's no indexed content to build a quiz from yet. Upload documents "
                "to this notebook or wait for indexing to finish, then try again."
            ),
        }
        if topic:
            detail["topic"] = topic
        super().__init__(detail=detail, code=self.default_code)


class QuizGenerationError(APIException):
    """Raised when the LLM call fails or returns output we can't parse.

    Transient AI-service failure — fail closed with a 503 rather than silently
    returning a placeholder quiz.
    """
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_code = QuizErrorCode.GENERATION_FAILED

    def __init__(self):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "Quiz generation is temporarily unavailable. Please try again in a moment.",
            },
            code=self.default_code,
        )
