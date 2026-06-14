from django.urls import path
from .views import (
    NotebookArchiveAPIView,
    NotebookDetailAPIView,
    NotebookFileCreateAPIView,
    NotebookFileDeleteAPIView,
    NotebookFileListAPIView,
    NotebookListAPIView,
    NotebookUnarchiveAPIView,
)
from rag.views import NotebookTopicsAPIView

urlpatterns = [
    path("", NotebookListAPIView.as_view(), name="list-notebooks"),
    path("<uuid:pk>", NotebookDetailAPIView.as_view(), name="notebook"),

    path("<uuid:pk>/archive", NotebookArchiveAPIView.as_view(), name="notebook-archive"),
    path("<uuid:pk>/unarchive", NotebookUnarchiveAPIView.as_view(), name="notebook-unarchive"),

    path("<uuid:notebook_id>/files", NotebookFileListAPIView.as_view(), name="list-notebook-files"),
    path("<uuid:notebook_id>/files/create", NotebookFileCreateAPIView.as_view(), name="file-create"),
    path("<uuid:notebook_id>/files/delete/<uuid:pk>/", NotebookFileDeleteAPIView.as_view(), name="file-delete"),

    path("<uuid:notebook_id>/topics", NotebookTopicsAPIView.as_view(), name="notebook-topics"),
]
