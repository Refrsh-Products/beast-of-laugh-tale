from rest_framework import generics
from rest_framework import status
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

class NotebookCreateAPIView(generics.CreateAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookDeleteAPIView(generics.DestroyAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookFileCreateAPIView(APIView):
    @extend_schema(
            request=NotebookFileSerializer,
            responses={
                  201: NotebookFileCreateResponseSerializer,
                  400: NotebookFileCreateResponseSerializer
                }
            )
    def post(self, request):
        serializer = NotebookFileInputSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                    {
                        "success" : False,
                        "errors" : serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        notebook = get_object_or_404(
                Notebook,
                id=serializer.validated_data["notebook_id"]
                )
        uploaded_file = serializer.validated_data["file"]
        created_flag = NotebookFileService.add_notebook_file(
                notebook=notebook,
                uploaded_file=uploaded_file
                )

        if created_flag:
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
    queryset = NotebookFile.objects.all()
    serializer_class = NotebookFileSerializer


class GenerateQuizView(APIView):
    def post(self, request):
        serializer = GenerateQuizInputSerialize(data=request.data)

        if serializer.is_valid() == False:
            return Response(
                        {
                            "success": False,
                            "errors": serializer.errors
                        }
                    )

        return Response(
                    {
                        "success": True,
                        "errors": []
                    }
                )























