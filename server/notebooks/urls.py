from django.urls import path
from .views import NotebookCreateAPIView
from .views import NotebookDeleteAPIView 

urlpatterns = [
    path("create/", NotebookCreateAPIView.as_view(), name="notebook-create"),
    path("delete/<int:pk>/", NotebookDeleteAPIView.as_view(), name="notebook-delete"),
]
