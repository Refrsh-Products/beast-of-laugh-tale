from django.urls import path
from .views import NotebookCreateAPIView
from .views import NotebookDeleteAPIView 
from .views import NotebookFileCreateAPIView 
from .views import NotebookFileDeleteAPIView

urlpatterns = [
    path("create/", NotebookCreateAPIView.as_view(), name="notebook-create"),
    path("delete/<int:pk>/", NotebookDeleteAPIView.as_view(), name="notebook-delete"),

    path("file/create", NotebookFileCreateAPIView.as_view(), name="notebook-file-create"),
    path("file/delete/<int:pk>/", NotebookFileDeleteAPIView.as_view(), name="notebook-file-delete"),
]
