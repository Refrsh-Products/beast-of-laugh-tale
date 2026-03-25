from django.db import models
from notebooks.models import Notebook
import uuid


class ChatRole(models.TextChoices):
    USER = "user", "User"
    CHATBOT = "chatbot", "Chatbot"


class Chats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook = models.ForeignKey(Notebook, related_name="chats", on_delete=models.CASCADE)
    title = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Chat"
        verbose_name_plural = "Chats"

    def __str__(self):
        return f"{self.title or 'Untitled'} ({self.id})"


class ChatMessages(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(Chats, related_name="messages", on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ChatRole.choices)
    content = models.TextField()
    token_count = models.IntegerField(null=True, blank=True)
    order_index = models.IntegerField(db_index=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["order_index"]
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        unique_together = [("chat", "order_index")]

    def __str__(self):
        return f"{self.role} message in chat {self.chat.pk} (index {self.order_index})"
