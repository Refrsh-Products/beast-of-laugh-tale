from django.urls import path
from .views import (
    AudioTranscribeAPIView,
    AudioTranscriptDetailAPIView,
    AudioTranscriptListAPIView,
    AudioTranscriptUpdateAPIView,
    GenerateNotesFromTranscriptAPIView,
)

urlpatterns = [
    path("<uuid:notebook_id>/audio/transcribe", AudioTranscribeAPIView.as_view(), name="audio-transcribe"),
    path("<uuid:notebook_id>/audio/transcripts", AudioTranscriptListAPIView.as_view(), name="audio-transcript-list"),
    path("<uuid:notebook_id>/audio/transcripts/<uuid:pk>", AudioTranscriptDetailAPIView.as_view(), name="audio-transcript-detail"),
    path("<uuid:notebook_id>/audio/transcripts/<uuid:transcript_id>/update", AudioTranscriptUpdateAPIView.as_view(), name="audio-transcript-update"),
    path("<uuid:notebook_id>/audio/transcripts/<uuid:transcript_id>/generate-notes", GenerateNotesFromTranscriptAPIView.as_view(), name="audio-generate-notes"),
]