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


class NotebookScanInputSerializer(serializers.Serializer):
    # Per-plan cap is enforced in the view; 10 is the absolute ceiling (PAID).
    photos = serializers.ListField(
        child=serializers.ImageField(),
        min_length=1,
        max_length=10,
    )


class ScanPhotoResultSerializer(serializers.Serializer):
    index = serializers.IntegerField()
    acceptable = serializers.BooleanField()
    clarity = serializers.ChoiceField(choices=["clear", "blurry", "unreadable"])
    relevance = serializers.ChoiceField(choices=["notes", "unrelated"])
    reason = serializers.CharField(allow_blank=True)


class NotebookScanCreateSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    # Field name intentionally matches the wire contract in
    # NotebookScanCreateResponse (client/shared); this class is schema-only
    # (drf-spectacular docs) and never instantiated/is_valid()'d, so the
    # shadowed Serializer.errors property is never actually accessed.
    errors = serializers.ListField(default=list)  # type: ignore[assignment, misc]
    id = serializers.UUIDField()
    ingestion_status = serializers.CharField()
    photo_count = serializers.IntegerField()


class NotebookScanRejectionSerializer(serializers.Serializer):
    code = serializers.CharField()
    message = serializers.CharField()
    photos = ScanPhotoResultSerializer(many=True)
