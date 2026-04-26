from rest_framework import serializers

from .models import Presentation, PresentationSlide


# ----- PresentationSlide -----

class PresentationSlideSerializer(serializers.ModelSerializer):
    """Read serializer — full slide detail including images list."""
    class Meta:
        model = PresentationSlide
        fields = [
            "id",
            "order_index",
            "layout",
            "title",
            "bullets",
            "speaker_notes",
            "images",
        ]
        read_only_fields = fields


class SlideUpdateSerializer(serializers.ModelSerializer):
    """Write serializer for manual slide edits — replaces the full images list."""
    class Meta:
        model = PresentationSlide
        fields = [
            "title",
            "layout",
            "bullets",
            "speaker_notes",
            "images",
        ]


# ----- Presentation -----

class PresentationListSerializer(serializers.ModelSerializer):
    """Lightweight read serializer for listing — no nested slides."""
    class Meta:
        model = Presentation
        fields = [
            "id",
            "title",
            "topic",
            "slide_count",
            "text_length",
            "status",
            "is_favourite",
            "generated_at",
            "completed_at",
        ]
        read_only_fields = fields


class PresentationDetailSerializer(serializers.ModelSerializer):
    """Full read serializer — presentation + nested slides."""
    slides = PresentationSlideSerializer(many=True, read_only=True)

    class Meta:
        model = Presentation
        fields = [
            "id",
            "notebook",
            "title",
            "topic",
            "custom_prompt",
            "slide_count",
            "text_length",
            "status",
            "error_message",
            "is_favourite",
            "generated_at",
            "completed_at",
            "slides",
        ]
        read_only_fields = fields


class PresentationCreateSerializer(serializers.ModelSerializer):
    """Write serializer — frontend supplies generation parameters."""
    topic = serializers.CharField(required=False, allow_blank=True, default="", max_length=255)
    topic_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    custom_prompt = serializers.CharField(required=False, allow_blank=True, default="", max_length=2000)

    class Meta:
        model = Presentation
        fields = [
            "topic",
            "topic_id",
            "custom_prompt",
            "slide_count",
            "text_length",
        ]

    def validate_slide_count(self, value):
        if value < 3:
            raise serializers.ValidationError("slide_count must be at least 3.")
        if value > 30:
            raise serializers.ValidationError("slide_count cannot exceed 30.")
        return value

    def create(self, validated_data):
        validated_data.pop("topic_id", None)
        return super().create(validated_data)


class PresentationUpdateSerializer(serializers.ModelSerializer):
    """Partial update — only title and is_favourite."""
    class Meta:
        model = Presentation
        fields = ["title", "is_favourite"]


# ----- AI refinement -----

class SlideRefineSerializer(serializers.Serializer):
    feedback = serializers.CharField(min_length=3, max_length=2000)
