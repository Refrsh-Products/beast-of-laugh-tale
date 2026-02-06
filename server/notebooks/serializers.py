from rest_framework import serializers
from .models import Notebook

class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = ["id", "title", "created_at"]
        read_only_fields = ["id", "created_at"]
