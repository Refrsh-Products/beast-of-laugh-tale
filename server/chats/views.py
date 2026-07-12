from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from notebooks.models import Notebook
from notebooks.services.activity import touch_notebook_activity
from notebooks.services.archive import assert_notebook_writable
from .renderers import ServerSentEventRenderer
from .serializers import ChatMessageCreateSerializer, ChatMessageSerializer, ChatSerializer, ChatCreateSerializer, ChatUpdateSerializer
from .models import Chats, ChatMessages, ChatRole
from .services.llm_service import _stream_llm_response
from .services.rag_retrieval_service import get_notebook_context, build_study_assistant_prompt


class ChatListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self) -> type[BaseSerializer]:  # type: ignore[override]
        if self.request.method == "POST":
            return ChatCreateSerializer
        return ChatSerializer

    def get_queryset(self):  # type: ignore[override]
        qs = Chats.objects.filter(notebook__user=self.request.user)
        notebook_id = self.request.query_params.get("notebook") # type: ignore
        if notebook_id:
            qs = qs.filter(notebook_id=notebook_id)
        return qs

    def perform_create(self, serializer):
        notebook = get_object_or_404(
            Notebook, id=self.request.data.get("notebook"), user=self.request.user  # type: ignore[attr-defined]
        )
        assert_notebook_writable(notebook)
        serializer.save(notebook=notebook)
        touch_notebook_activity(notebook_id=notebook.id)

    def create(self, request, *args, **kwargs):
        """Respond with the full read shape (notebook_id, created_at, updated_at)
        rather than the write serializer's echo, so clients can render a newly
        created session (timestamps, `ChatSession` in @freshr/shared) without a
        follow-up list refetch."""
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        self.perform_create(write_serializer)
        read_serializer = ChatSerializer(write_serializer.instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

class ChatDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)
    lookup_url_kwarg = "chat_id"

    def get_serializer_class(self) -> type[BaseSerializer]:  # type: ignore[override]
        if self.request.method in ("PUT", "PATCH"):
            return ChatUpdateSerializer
        return ChatSerializer

    def get_queryset(self):  # type: ignore[override]
        return Chats.objects.filter(notebook__user=self.request.user)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self) -> type[BaseSerializer]:  # type: ignore[override]
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self):  # type: ignore[override]
        return ChatMessages.objects.filter(
            chat__id=self.kwargs["chat_id"],
            chat__notebook__user=self.request.user,
            is_deleted=False,
        )

    def perform_create(self, serializer):
        chat = get_object_or_404(
            Chats.objects.select_related("notebook"),
            id=self.kwargs["chat_id"],
            notebook__user=self.request.user,
        )
        assert_notebook_writable(chat.notebook)
        next_index = ChatMessages.objects.filter(chat=chat).count()
        serializer.save(chat=chat, role=ChatRole.USER, order_index=next_index)

    def create(self, request, *args, **kwargs):
        """Respond with the full message (id, role, order_index, …), not just the
        write serializer's echo — clients append the response to their message
        list and need the real shape (`ChatMessage` in @freshr/shared)."""
        write_serializer = self.get_serializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        self.perform_create(write_serializer)
        read_serializer = ChatMessageSerializer(write_serializer.instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        touch_notebook_activity(notebook_id=chat.notebook_id) # type: ignore


class ChatMessageStreamView(APIView):
    permission_classes = (IsAuthenticated,)
    # JSONRenderer first so `Accept: */*` (web's fetch) still negotiates to JSON;
    # the SSE renderer matches EventSource clients' `Accept: text/event-stream`.
    renderer_classes = (JSONRenderer, ServerSentEventRenderer)

    def get(self, request: Request, chat_id: str) -> Response | StreamingHttpResponse:
        # FETCH DATA
        chat = get_object_or_404(Chats, id=chat_id, notebook__user=request.user)
        
        assert_notebook_writable(chat.notebook)
        
        messages = ChatMessages.objects.filter(
            chat=chat, is_deleted=False
        ).order_by("order_index")

        last_user_message = messages.filter(role=ChatRole.USER).last()
        if last_user_message is None:
            return Response(
                {"detail": "No user message to respond to."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        context = get_notebook_context(chat, request.user.id, last_user_message.content)
        system_prompt = build_study_assistant_prompt(context)
        
        # Map to Claude-compatible roles ("user" / "assistant")
        conversation_history = [
            {
                "role": "user" if msg.role == ChatRole.USER else "assistant",
                "content": msg.content,
            }
            for msg in messages
        ]

        # STREAM DATA
        streaming_response = StreamingHttpResponse(
            _stream_llm_response(chat, system_prompt, conversation_history, messages.count()),
            content_type="text/event-stream",
        )
        streaming_response["Cache-Control"] = "no-cache"
        streaming_response["X-Accel-Buffering"] = "no"
        return streaming_response
