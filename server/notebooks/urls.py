from django.urls import path
from .views import NotebookFileListAPIView, NotebookListAPIView, NotebookDetailAPIView, NotebookFileCreateAPIView, NotebookFileDeleteAPIView
from rag.views import NotebookTopicsAPIView

urlpatterns = [
    path("", NotebookListAPIView.as_view(), name="list-notebooks"), # Returns a list of all the notebooks associated to the account
    path("<uuid:pk>", NotebookDetailAPIView.as_view(), name="notebook"), # Retrieve, Update, Destroy operation for an existing notebook

    path("<uuid:notebook_id>/files", NotebookFileListAPIView.as_view(), name="list-notebook-files"), # Return the list of files in the notebook
    path("<uuid:notebook_id>/files/create", NotebookFileCreateAPIView.as_view(), name="file-create"), # Create a file in the dabase
    path("<uuid:notebook_id>/files/delete/<uuid:pk>/", NotebookFileDeleteAPIView.as_view(), name="file-delete"), # Delete the file

    path("<uuid:notebook_id>/topics", NotebookTopicsAPIView.as_view(), name="notebook-topics"), # List AI-discovered topics for a notebook
]
