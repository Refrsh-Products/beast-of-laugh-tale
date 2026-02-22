from django.urls import path
from .views import NotebookCreateAPIView
from .views import NotebookDeleteAPIView 
from .views import NotebookFileCreateAPIView 
from .views import NotebookFileDeleteAPIView
from .views import GenerateQuizView

urlpatterns = [
    path("create/", NotebookCreateAPIView.as_view(), name="create"),
    path("delete/<int:pk>/", NotebookDeleteAPIView.as_view(), name="delete"),

    path("<int:notebook_id>/file/create", NotebookFileCreateAPIView.as_view(), name="file-create"),
    path("file/delete/<int:pk>/", NotebookFileDeleteAPIView.as_view(), name="file-delete"),
    path("generate_quiz/", GenerateQuizView.as_view(), name="generate-quiz"),
]
