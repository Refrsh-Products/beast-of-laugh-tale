from rest_framework import generics
from .models import Notebook
from .serializers import NotebookSerializer

class NotebookCreateAPIView(generics.CreateAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer


class NotebookDeleteAPIView(generics.DestroyAPIView):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer
