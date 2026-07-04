from rest_framework import serializers
from .models import Notebook, NotebookFile


class NotebookFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotebookFile
        fields = [
                "id",
                "name",
                "file",
                "file_size",
                "file_type",
                "ingestion_status",
                "ingestion_error",
                "uploaded_at",
                "updated_at",
                ]


class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = '__all__'
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
            "is_archived",
            "archived_at",
            "last_activity_at",
        ]


class NotebookFileInputSerializer(serializers.Serializer):
    file = serializers.FileField()


class NotebookFileCreateSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error_messages = serializers.ListField(default=list)
    id = serializers.UUIDField()
    ingestion_status = serializers.CharField()


class NotebookFileCreateErrorSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error_messages = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField()),
        default=dict
    )
