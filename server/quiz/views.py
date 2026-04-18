from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import date
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from notebooks.models import Notebook
from accounts.models import Account, DailyUsage
from accounts.services import quota
from .models import QuizSession, QuizQuestion, QuizStatus
from .services.quiz_generation import generate_quiz_from_rag, generate_quiz_from_entire_notebook
from .serializers import (
    QuizSessionListSerializer,
    QuizSessionDetailSerializer,
    QuizSessionCreateSerializer,
    QuizSessionUpdateSerializer,
    QuizSubmitSerializer,
)

NOTEBOOK_QUERY_PARAM = OpenApiParameter(
    name="notebook",
    description="UUID of the notebook to scope quizzes to.",
    required=True,
    type=str,
    location=OpenApiParameter.QUERY,
)


@extend_schema(parameters=[NOTEBOOK_QUERY_PARAM])
class QuizSessionListCreateView(generics.ListCreateAPIView):
    """
    GET:  List all quiz sessions for a notebook (?notebook=<id>)
    POST: Generate a new quiz session for a notebook (?notebook=<id>)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self): # type: ignore
        if self.request.method == "POST":
            return QuizSessionCreateSerializer
        return QuizSessionListSerializer

    def get_queryset(self): # type: ignore
        qs = QuizSession.objects.filter(notebook__user=self.request.user)
        notebook_id = self.request.query_params.get("notebook") # type: ignore
        if notebook_id:
            qs = qs.filter(notebook_id=notebook_id)
        return qs

    def create(self, request, *_args, **_kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = self.perform_create(serializer)
        detail_serializer = QuizSessionDetailSerializer(quiz)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        notebook_id = self.request.query_params.get("notebook") # type: ignore
        notebook = get_object_or_404(Notebook, id=notebook_id, user=self.request.user)

        data = serializer.validated_data
        topic = data.get("topic", "")
        topic_id = data.get("topic_id")

        is_all_topics = not topic_id and (not topic or topic.strip() == "" or topic == "All Topics")

        if is_all_topics:
            serializer.validated_data["topic"] = "All Topics"
            generated = generate_quiz_from_entire_notebook(
                notebook_id=str(notebook.pk),
                user_id=str(self.request.user.pk),
                num_questions=data["num_questions"],
                difficulty=data["difficulty"],
            )
        else:
            generated = generate_quiz_from_rag(
                topic=topic,
                topic_id=str(topic_id) if topic_id else None,
                notebook_id=str(notebook.pk),
                user_id=str(self.request.user.pk),
                num_questions=data["num_questions"],
                difficulty=data["difficulty"],
            )

        with transaction.atomic():
            account = Account.objects.select_for_update().get(user=self.request.user)
            usage, _ = DailyUsage.objects.select_for_update().get_or_create(
                account=account, date=date.today()
            )
            if not quota.check_daily_quiz_quota(account):
                raise PermissionDenied("Daily quiz limit reached for your plan.")

            # Generate quiz
            quiz = serializer.save(notebook=notebook, title=generated["title"])
            QuizQuestion.objects.bulk_create([
                QuizQuestion(quiz=quiz, **q) for q in generated["questions"]
            ])

            usage.quizzes_generated += 1
            usage.save()

        return quiz


class QuizSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET:    Retrieve a single quiz session with all its questions
    PATCH:  Update title or is_favourite
    DELETE: Delete a quiz session
    """
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "quiz_id"

    def get_serializer_class(self):  # type: ignore[override]
        if self.request.method in ("PUT", "PATCH"):
            return QuizSessionUpdateSerializer
        return QuizSessionDetailSerializer

    def get_queryset(self): # type: ignore
        return QuizSession.objects.filter(notebook__user=self.request.user)


@extend_schema(parameters=[NOTEBOOK_QUERY_PARAM])
class QuizSessionFavouritesView(generics.ListAPIView):
    """
    GET: List all favourited quiz sessions, optionally filtered by notebook (?notebook=<id>)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = QuizSessionListSerializer

    def get_queryset(self): # type: ignore
        qs = QuizSession.objects.filter(notebook__user=self.request.user, is_favourite=True)
        notebook_id = self.request.query_params.get("notebook") # type: ignore
        if notebook_id:
            qs = qs.filter(notebook_id=notebook_id)
        return qs


class QuizSessionSubmitView(APIView):
    """
    POST: Submit answers for a quiz session, compute score, mark as completed
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(request=QuizSubmitSerializer, responses=QuizSessionDetailSerializer)
    def post(self, request, quiz_id):
        quiz = get_object_or_404(QuizSession, id=quiz_id, notebook__user=request.user)

        if quiz.status == QuizStatus.COMPLETED:
            return Response(
                {"detail": "This quiz has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        answers = serializer.validated_data["answers"]  # type: ignore[index]
        question_map = {str(q.id): q for q in QuizQuestion.objects.filter(quiz=quiz)}

        correct_count = 0
        for answer in answers:
            question = question_map.get(str(answer["question_id"]))
            if not question:
                continue
            question.user_answer = answer["user_answer"]
            question.is_correct = answer["user_answer"] == question.correct_answer
            if question.is_correct:
                correct_count += 1
            question.save()

        quiz.score = correct_count / quiz.num_questions
        quiz.status = QuizStatus.COMPLETED
        quiz.completed_at = timezone.now()
        quiz.save()

        return Response(QuizSessionDetailSerializer(quiz).data, status=status.HTTP_200_OK)


class QuizSessionRetakeView(APIView):
    """
    POST: Create a new quiz session copied from an existing one
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        source = get_object_or_404(QuizSession, id=quiz_id, notebook__user=request.user)

        root_id = source.source_session_id or source.id  # type: ignore[attr-defined]
        new_session = QuizSession.objects.create(
            notebook=source.notebook,
            source_session_id=root_id,
            title=f"{source.title}_copy",
            topic=source.topic,
            difficulty=source.difficulty,
            quiz_type=source.quiz_type,
            num_questions=source.num_questions,
            time_limit=source.time_limit,
        )

        source_questions = QuizQuestion.objects.filter(
            quiz=QuizSession.objects.get(id=root_id)
        )
        QuizQuestion.objects.bulk_create([
            QuizQuestion(
                quiz=new_session,
                question_text=q.question_text,
                question_type=q.question_type,
                choices=q.choices,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                order_index=q.order_index,
            )
            for q in source_questions
        ])

        return Response(QuizSessionDetailSerializer(new_session).data, status=status.HTTP_201_CREATED)