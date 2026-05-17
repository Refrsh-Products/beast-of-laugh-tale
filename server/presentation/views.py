from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Account
from accounts.services import quota
from notebooks.models import Notebook
from notebooks.errors import PresentationQuotaExceededError
from notebooks.services.activity import touch_notebook_activity
from notebooks.services.archive import assert_notebook_writable

from .models import Presentation, PresentationSlide, PresentationStatus
from .serializers import (
    PresentationCreateSerializer,
    PresentationDetailSerializer,
    PresentationListSerializer,
    PresentationUpdateSerializer,
    PresentationSlideSerializer,
    SlideRefineSerializer,
    SlideUpdateSerializer,
)
from .services.generation import refine_slide
from .tasks import generate_presentation_task


NOTEBOOK_QUERY_PARAM = OpenApiParameter(
    name="notebook",
    description="UUID of the notebook to scope presentations to.",
    required=True,
    type=str,
    location=OpenApiParameter.QUERY,
)


@extend_schema(parameters=[NOTEBOOK_QUERY_PARAM])
class PresentationListCreateView(generics.ListCreateAPIView):
    """
    GET:  List all presentations for a notebook (?notebook=<id>)
    POST: Create a presentation row + enqueue Celery generation (?notebook=<id>)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):  # type: ignore[override]
        if self.request.method == "POST":
            return PresentationCreateSerializer
        return PresentationListSerializer

    def get_queryset(self):  # type: ignore[override]
        qs = Presentation.objects.filter(notebook__user=self.request.user)
        notebook_id = self.request.query_params.get("notebook")  # type: ignore[attr-defined]
        if notebook_id:
            qs = qs.filter(notebook_id=notebook_id)
        return qs

    def create(self, request, *_args, **_kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        presentation, topic_id = self._create_with_quota(serializer)
        # Enqueue AFTER the atomic block commits so the worker can read the row
        generate_presentation_task.delay(str(presentation.id), str(topic_id) if topic_id else None)
        detail = PresentationDetailSerializer(presentation)
        return Response(detail.data, status=status.HTTP_202_ACCEPTED)

    def _create_with_quota(self, serializer):
        notebook_id = self.request.query_params.get("notebook")  # type: ignore[attr-defined]
        notebook = get_object_or_404(Notebook, id=notebook_id, user=self.request.user)
        assert_notebook_writable(notebook)

        data = serializer.validated_data
        topic = data.get("topic", "") or ""
        topic_id = data.get("topic_id")
        is_all_topics = not topic_id and (not topic or topic.strip() == "" or topic == "All Topics")
        if is_all_topics:
            serializer.validated_data["topic"] = "All Topics"

        with transaction.atomic():
            account = Account.objects.select_for_update().get(user=self.request.user)
            if not quota.check_presentation_quota(account):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                raise PresentationQuotaExceededError(limit=limits["max_presentations_total"])

            presentation = serializer.save(
                notebook=notebook,
                title=f"Generating: {serializer.validated_data['topic']}"[:255],
                status=PresentationStatus.QUEUED,
            )
            account.presentations_generated += 1
            account.save(update_fields=["presentations_generated"])

            touch_notebook_activity(notebook_id=notebook_id)

        return presentation, topic_id


class PresentationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET:    Retrieve presentation + nested slides (used as polling target)
    PATCH:  Update title or is_favourite
    DELETE: Delete a presentation
    """
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "presentation_id"

    def get_serializer_class(self):  # type: ignore[override]
        if self.request.method in ("PUT", "PATCH"):
            return PresentationUpdateSerializer
        return PresentationDetailSerializer

    def get_queryset(self):  # type: ignore[override]
        return Presentation.objects.filter(notebook__user=self.request.user)


@extend_schema(parameters=[NOTEBOOK_QUERY_PARAM])
class PresentationFavouritesView(generics.ListAPIView):
    """
    GET: List favourited presentations, optionally scoped to a notebook (?notebook=<id>)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PresentationListSerializer

    def get_queryset(self):  # type: ignore[override]
        qs = Presentation.objects.filter(notebook__user=self.request.user, is_favourite=True)
        notebook_id = self.request.query_params.get("notebook")  # type: ignore[attr-defined]
        if notebook_id:
            qs = qs.filter(notebook_id=notebook_id)
        return qs


class SlideUpdateView(APIView):
    """
    PATCH: Manual edit of a single slide. Replaces the full images list.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(request=SlideUpdateSerializer, responses=PresentationSlideSerializer)
    def patch(self, request, presentation_id, slide_id):
        slide = get_object_or_404(
            PresentationSlide,
            id=slide_id,
            presentation_id=presentation_id,
            presentation__notebook__user=request.user,
        )
        serializer = SlideUpdateSerializer(slide, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        touch_notebook_activity(slide.presentation.notebook_id) # type: ignore
        
        return Response(PresentationSlideSerializer(slide).data, status=status.HTTP_200_OK)


class SlideRefineView(APIView):
    """
    POST: Apply user feedback to a slide via Claude. Synchronous (~3-5s).
    Body: {feedback: str}. Preserves the slide's images list.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(request=SlideRefineSerializer, responses=PresentationSlideSerializer)
    def post(self, request, presentation_id, slide_id):
        slide = get_object_or_404(
            PresentationSlide,
            id=slide_id,
            presentation_id=presentation_id,
            presentation__notebook__user=request.user,
        )
        assert_notebook_writable(slide.presentation.notebook_id) # type: ignore
        body = SlideRefineSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        presentation = slide.presentation  # type: ignore[attr-defined]
        neighbours = list(
            PresentationSlide.objects
            .filter(presentation=presentation)
            .exclude(id=slide.id)
            .order_by("order_index")
            .values("order_index", "title", "bullets")
        )

        updated = refine_slide(
            slide={
                "title": slide.title,
                "layout": slide.layout,
                "bullets": slide.bullets,
                "body_text": slide.body_text,
                "quote": slide.quote,
                "quote_source": slide.quote_source,
                "caption": slide.caption,
                "speaker_notes": slide.speaker_notes,
            },
            feedback=body.validated_data["feedback"],  # type: ignore[index]
            presentation_title=presentation.title,
            neighbor_slides=neighbours,
        )

        slide.title = updated["title"]
        slide.layout = updated["layout"]
        slide.bullets = updated["bullets"]
        slide.body_text = updated["body_text"]
        slide.quote = updated["quote"]
        slide.quote_source = updated["quote_source"]
        slide.caption = updated["caption"]
        slide.speaker_notes = updated["speaker_notes"]
        slide.save(update_fields=[
            "title", "layout", "bullets",
            "body_text", "quote", "quote_source", "caption",
            "speaker_notes",
        ])

        touch_notebook_activity(presentation.notebook_id) # type: ignore

        return Response(PresentationSlideSerializer(slide).data, status=status.HTTP_200_OK)
