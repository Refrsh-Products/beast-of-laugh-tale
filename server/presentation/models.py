import uuid

from django.db import models

from notebooks.models import Notebook


class TextLength(models.TextChoices):
    BRIEF = 'BRIEF', 'Brief'
    BALANCED = 'BALANCED', 'Balanced'
    DETAILED = 'DETAILED', 'Detailed'


class PresentationTheme(models.TextChoices):
    """Slide colour scheme chosen by the user in the generator.

    Purely presentational — the client maps the key to a palette when it renders
    the deck in the viewer and in the PDF/PPTX exports.
    """
    FRESHR = 'freshr', 'Freshr'
    MINIMAL = 'minimal', 'Minimal'
    DARK = 'dark', 'Dark'
    ACADEMIC = 'academic', 'Academic'
    SERIF = 'serif', 'Serif'


class PresentationStatus(models.TextChoices):
    QUEUED = 'QUEUED', 'Queued'
    GENERATING = 'GENERATING', 'Generating'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'


class Presentation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name="presentations")
    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)
    custom_prompt = models.TextField(blank=True)
    slide_count = models.IntegerField()
    text_length = models.CharField(max_length=10, choices=TextLength, default=TextLength.BALANCED)
    theme = models.CharField(max_length=16, choices=PresentationTheme, default=PresentationTheme.FRESHR)
    status = models.CharField(max_length=15, choices=PresentationStatus, default=PresentationStatus.QUEUED)
    error_message = models.TextField(blank=True)
    is_favourite = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.title} ({self.status})"


class PresentationSlide(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    presentation = models.ForeignKey(Presentation, on_delete=models.CASCADE, related_name="slides")
    order_index = models.IntegerField()
    layout = models.CharField(max_length=32, default='bullets')
    title = models.CharField(max_length=255, blank=True)
    bullets = models.JSONField(default=list)
    body_text = models.TextField(blank=True)
    quote = models.TextField(blank=True)
    quote_source = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=500, blank=True)
    speaker_notes = models.TextField(blank=True)
    images = models.JSONField(default=list)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Slide {self.order_index}: {self.title[:60]}"
