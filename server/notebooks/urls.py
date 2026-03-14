from django.urls import path
from .views import NotebookListAPIView, NotebookDetailAPIView
from .views import NotebookFileCreateAPIView 
from .views import NotebookFileDeleteAPIView
from .views import GenerateQuizView

urlpatterns = [
    path("", NotebookListAPIView.as_view(), name="list-notebooks"), # Returns a list of all the notebooks associated to the account
    path("notebook/<uuid:pk>", NotebookDetailAPIView.as_view(), name="notebook"), # Retrieve, Update, Destroy operation for an existing notebook

    path("<uuid:notebook_id>/file/create", NotebookFileCreateAPIView.as_view(), name="file-create"),
    path("file/delete/<int:pk>/", NotebookFileDeleteAPIView.as_view(), name="file-delete"),
    path("generate_quiz/", GenerateQuizView.as_view(), name="generate-quiz"),
]
