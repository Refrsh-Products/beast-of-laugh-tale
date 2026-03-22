from rest_framework import serializers
from .models import Chats, ChatMessages

# ----- ChatMessages -----

class ChatMessageSerializer(serializers.ModelSerializer):
    """Read serializer - used for listing messages in a chat."""
    class Meta:
        model = ChatMessages
        fields = ["id", "role", "content", "token_count", "order_index", "sent_at", "is_deleted"]
        read_only_fields = fields

class ChatMessageCreateSerializer(serializers.Serializer):
    """Write serializer — only content is accepted from the client.
    role, chat, and order_index are all set by the view."""
    content = serializers.CharField()

    def create(self, validated_data):
        return ChatMessages.objects.create(**validated_data)

# ----- Chats ------

class ChatSerializer(serializers.ModelSerializer):
    """Lightweight read serializer for the list view — no messages."""
    class Meta:
        model = Chats
        fields = ["id", "notebook_id", "title", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ChatCreateSerializer(serializers.ModelSerializer):
    """Write serializer — notebook and optional title come from the client."""
    class Meta:
        model = Chats
        fields = ["id", "notebook", "title"]
        read_only_fields = ["id"]

class ChatUpdateSerializer(serializers.ModelSerializer):
    """Partial update serializer — only title can be changed."""
    class Meta:
        model = Chats
        fields = ["title"]