from rest_framework import generics
from rest_framework import status
from .models import Notebook
from .serializers import NotebookSerializer
from .serializers import NotebookFileInputSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from pathlib import Path
from .services.notebook_file import NotebookFileService

class NotebookCreateAPIView(generics.CreateAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookDeleteAPIView(generics.DestroyAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookFileCreateAPIView(APIView):
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
                    {"success": True},
                    status=status.HTTP_201_CREATED
                    )
        else:
            response = Response(
                    {"success": False},
                    status=status.HTTP_400_BAD_REQUEST
                    )

        return response

