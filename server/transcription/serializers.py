from rest_framework import serializers
from .models import AudioTranscript



class AudioTranscriptSerializer(serializers.ModelSerializer):
    has_notes = serializers.SerializerMethodField()

    class Meta:
        model = AudioTranscript
        fields = [
            "id",
            "title",
            "transcript_text",
            "notes_text",
            "has_notes",
            "transcription_status",
            "transcription_error",
            "notes_status",
            "notes_error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "transcription_status",
            "transcription_error",
            "notes_status",
            "notes_error",
            "created_at",
            "updated_at",
        ]

    def get_has_notes(self, obj):
        return bool(obj.notes_text)


class AudioTranscriptListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list view — omits full text fields."""
    has_notes = serializers.SerializerMethodField()

    class Meta:
        model = AudioTranscript
        fields = [
            "id",
            "title",
            "has_notes",
            "transcription_status",
            "notes_status",
            "created_at",
        ]

    def get_has_notes(self, obj):
        return bool(obj.notes_text)