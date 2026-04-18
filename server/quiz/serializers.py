from rest_framework import serializers
from .models import QuizSession, QuizQuestion


# ----- QuizQuestion -----

class QuizQuestionSerializer(serializers.ModelSerializer):
    """Read serializer — full question detail including user's answer and result."""
    class Meta:
        model = QuizQuestion
        fields = [
            "id",
            "question_text",
            "question_type",
            "choices",
            "correct_answer",
            "explanation",
            "user_answer",
            "is_correct",
            "time_taken",
            "order_index",
        ]
        read_only_fields = fields


# ----- QuizSession -----

class QuizSessionListSerializer(serializers.ModelSerializer):
    """Lightweight read serializer for listing sessions — no nested questions."""
    class Meta:
        model = QuizSession
        fields = [
            "id",
            "title",
            "topic",
            "difficulty",
            "quiz_type",
            "num_questions",
            "score",
            "status",
            "is_favourite",
            "started_at",
            "completed_at",
        ]
        read_only_fields = fields


class QuizSessionDetailSerializer(serializers.ModelSerializer):
    """Full read serializer — session + nested questions. Used for quiz-taking and results."""
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = QuizSession
        fields = [
            "id",
            "notebook",
            "source_session",
            "title",
            "topic",
            "difficulty",
            "quiz_type",
            "num_questions",
            "time_limit",
            "score",
            "status",
            "is_favourite",
            "started_at",
            "completed_at",
            "generated_at",
            "questions",
        ]
        read_only_fields = fields


class QuizSessionCreateSerializer(serializers.ModelSerializer):
    """Write serializer — frontend provides quiz parameters, view handles generation."""
    topic = serializers.CharField(required=False, allow_blank=True, default="", max_length=255)
    topic_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = QuizSession
        fields = [
            "topic",
            "topic_id",
            "difficulty",
            "quiz_type",
            "num_questions",
            "time_limit",
        ]

    def validate_time_limit(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("time_limit must be a positive number of seconds.")
        return value

    def validate_num_questions(self, value):
        if value <= 0:
            raise serializers.ValidationError("num_questions must be at least 1.")
        if value > 50:
            raise serializers.ValidationError("num_questions cannot exceed 50.")
        return value

    def create(self, validated_data):
        validated_data.pop("topic_id", None)
        return super().create(validated_data)


class QuizSessionUpdateSerializer(serializers.ModelSerializer):
    """Partial update serializer — only title and is_favourite can be changed by the frontend."""
    class Meta:
        model = QuizSession
        fields = ["title", "is_favourite"]


# ----- Quiz submission -----

class QuizAnswerSerializer(serializers.Serializer):
    """A single answer submission from the frontend."""
    question_id = serializers.UUIDField()
    user_answer = serializers.CharField()


class QuizSubmitSerializer(serializers.Serializer):
    """Wraps a list of answers for a full quiz submission."""
    answers = QuizAnswerSerializer(many=True)

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("answers must not be empty.")
        return value