from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Notebook, NotebookFile
from .serializers import NotebookSerializer, NotebookFileSerializer, NotebookFileInputSerializer, NotebookFileCreateSuccessSerializer, NotebookFileCreateErrorSerializer

from django.shortcuts import get_object_or_404
from .services.notebook_file import NotebookFileService
from drf_spectacular.utils import extend_schema
from rag.tasks import ingest_note_task
from rest_framework.permissions import IsAuthenticated


class NotebookDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotebookSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self): # type: ignore
        return get_object_or_404(Notebook, pk=self.kwargs["pk"], user=self.request.user)

class NotebookListAPIView(generics.ListCreateAPIView):
    queryset = Notebook.objects.none()
    serializer_class = NotebookSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self): # type: ignore
        return Notebook.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# TODO: Create Archive View - show list of all archived notebooks, change an archived notebook to unarchived

class NotebookFileCreateAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    @extend_schema(
        request={
            'multipart/form-data': NotebookFileInputSerializer
        },
        responses={
            201: NotebookFileCreateSuccessSerializer,
            400: NotebookFileCreateErrorSerializer
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
        uploaded_file = serializer.validated_data["file"] # type: ignore
        notebook_file = NotebookFileService.add_notebook_file(
                notebook=notebook,
                uploaded_file=uploaded_file
                )
        if notebook_file:
            ingest_note_task.delay(notebook_file.pk)  # type: ignore[attr-defined]
            response = Response(
                    {
                        "success": True,
                        "errors": [],
                        "id": str(notebook_file.pk),
                        "ingestion_status": notebook_file.ingestion_status,
                    },
                    status=status.HTTP_201_CREATED
                    )
        else:
            response = Response(
                    {"success": False, "errors": []},
                    status=status.HTTP_400_BAD_REQUEST
                    )

        return response
    
class NotebookFileListAPIView(generics.ListAPIView):
    queryset = NotebookFile.objects.none()
    serializer_class = NotebookFileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self): # type: ignore
        notebook = get_object_or_404(Notebook, id=self.kwargs["notebook_id"], user=self.request.user)
        return NotebookFile.objects.filter(notebook=notebook)

class NotebookFileDeleteAPIView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotebookFileSerializer

    def get_queryset(self): # type: ignore
        notebook_id = self.kwargs.get('notebook_id')
        return NotebookFile.objects.filter(
            notebook__user=self.request.user, 
            notebook_id=notebook_id
        )
