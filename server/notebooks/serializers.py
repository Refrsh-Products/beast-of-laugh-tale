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
        fields = '__all__'
        read_only_fields = ["id", "user", "created_at", "updated_at"]



class NotebookFileInputSerializer(serializers.Serializer):
    file = serializers.FileField()


class NotebookFileCreateResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    error_messages = serializers.DictField(
               child=serializers.ListField(
                   child=serializers.CharField()
                   ),
               default=dict
            )
    status = serializers.IntegerField()


class GenerateQuizInputSerialize(serializers.Serializer):
    notebook_id = serializers.IntegerField()
