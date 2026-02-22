from rest_framework import generics
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Notebook
from .models import NotebookFile
from .serializers import NotebookSerializer
from .serializers import NotebookFileSerializer
from .serializers import NotebookFileInputSerializer
from .serializers import NotebookFileCreateResponseSerializer
from .serializers import GenerateQuizInputSerialize

from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from pathlib import Path
from .services.notebook_file import NotebookFileService
from drf_spectacular.utils import extend_schema
from .services.notebook_file import ContentReaderService
from rag.tasks import ingest_note_task
from rest_framework.permissions import IsAuthenticated


class NotebookCreateAPIView(generics.CreateAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotebookDeleteAPIView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookFileCreateAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    @extend_schema(
        request={
            'multipart/form-data': NotebookFileInputSerializer
        },
        responses={
            201: NotebookFileCreateResponseSerializer,
            400: NotebookFileCreateResponseSerializer
        }
    )
    def post(self, request, notebook_id):
        notebook = get_object_or_404(Notebook, id=notebook_id, user=request.user)
        
        serializer = NotebookFileInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                    {
                        "success" : False,
                        "errors" : serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        uploaded_file = serializer.validated_data["file"]
        notebook_file = NotebookFileService.add_notebook_file(
                notebook=notebook,
                uploaded_file=uploaded_file
                )

        if notebook_file:
            ingest_note_task.delay(notebook_file.pk)  # type: ignore[attr-defined]
            response = Response(
                    {"success": True, "errors": []},
                    status=status.HTTP_201_CREATED
                    )
        else:
            response = Response(
                    {"success": False, "errors": []},
                    status=status.HTTP_400_BAD_REQUEST
                    )

        return response

class NotebookFileDeleteAPIView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = NotebookFile.objects.all()
    serializer_class = NotebookFileSerializer


class GenerateQuizView(APIView):
    permission_classes = (IsAuthenticated,)
    def post(self, request):
        serializer = GenerateQuizInputSerialize(data=request.data)

        if serializer.is_valid() == False:
            return Response(
                        {
                            "success": False,
                            "errors": serializer.errors
                        }
                    )

        notebook_id = serializer.validated_data["notebook_id"]
        reader = ContentReaderService()
        content_map = reader.read_content_of(notebook_id=notebook_id)




        return Response(
                    {
                        "success": True,
                        "errors": [],
                        "map": content_map
                    }
                )























