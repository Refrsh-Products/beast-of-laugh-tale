from django.db import models
import uuid
from notebooks.models import Notebook


class DifficultyChoices(models.TextChoices):
    EASY = 'EASY', 'Easy'
    MEDIUM = 'MEDIUM', 'Medium'
    HARD = 'HARD', 'Hard'


class QuizType(models.TextChoices):
    TIMED = 'TIMED', 'Timed'
    PRACTICE = 'PRACTICE', 'Practice'


class QuizStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    ABANDONED = 'ABANDONED', 'Abandoned'


class QuizGenerationStatus(models.TextChoices):
    """Lifecycle of the AI *generation* job — distinct from ``QuizStatus``, which
    tracks quiz-*taking*. A quiz is QUEUED on create, flips to GENERATING while the
    Celery task runs, then COMPLETED (questions ready) or FAILED (see error_message)."""
    QUEUED = 'QUEUED', 'Queued'
    GENERATING = 'GENERATING', 'Generating'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'


class QuestionType(models.TextChoices):
    MCQ = 'MCQ', 'Multiple Choice'
    TRUE_FALSE = 'TRUE_FALSE', 'True / False'


class QuizSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="quiz_sessions")
    source_session = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name="retakes")
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DifficultyChoices, default=DifficultyChoices.EASY)
    quiz_type = models.CharField(max_length=10, choices=QuizType, default=QuizType.PRACTICE)
    num_questions = models.IntegerField()
    time_limit = models.IntegerField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=QuizStatus, default=QuizStatus.IN_PROGRESS)
    generation_status = models.CharField(
        max_length=15, choices=QuizGenerationStatus, default=QuizGenerationStatus.COMPLETED
    )
    error_message = models.TextField(blank=True)
    is_favourite = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.title} ({self.status})"


class QuizQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(QuizSession, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QuestionType, default=QuestionType.MCQ)
    choices = models.JSONField(default=list)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    user_answer = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    time_taken = models.IntegerField(null=True, blank=True)
    order_index = models.IntegerField()

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Q{self.order_index}: {self.question_text[:60]}"
