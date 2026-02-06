from django.urls import path
from .views import NotebookCreateAPIView

urlpatterns = [
        path("create/", NotebookCreateAPIView.as_view(), name="notebook-create"),
]
