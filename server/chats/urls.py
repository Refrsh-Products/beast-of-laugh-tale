from django.urls import path
from . import views

urlpatterns = [
    path("", views.ChatListCreateView.as_view(), name="chat-list-create"),
    path("<uuid:chat_id>/", views.ChatDetailView.as_view(), name="chat-detail"),
    path("<uuid:chat_id>/messages/", views.ChatMessageListCreateView.as_view(), name="chat-message-list-create"),
    path("<uuid:chat_id>/messages/stream/", views.ChatMessageStreamView.as_view(), name="chat-message-stream"),
]
