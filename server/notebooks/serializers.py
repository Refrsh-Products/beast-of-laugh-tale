from rest_framework import serializers
from .models import Notebook
from .models import NotebookFile

class NotebookFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotebookFile
        fields = [
                "id", 
                "name", 
                "file", 
                "content",
                "file_type",
                "uploaded_at",
                "updated_at"
                ]

class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = ["id", "title", "created_at"]
        read_only_fields = ["id", "created_at"]
