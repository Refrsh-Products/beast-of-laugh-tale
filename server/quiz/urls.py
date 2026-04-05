from django.urls import path
from . import views

urlpatterns = [
    path("", views.QuizSessionListCreateView.as_view(), name="quiz-list-create"),
    path("favourites/", views.QuizSessionFavouritesView.as_view(), name="quiz-favourites"),
    path("<uuid:quiz_id>/", views.QuizSessionDetailView.as_view(), name="quiz-detail"),
    path("<uuid:quiz_id>/submit/", views.QuizSessionSubmitView.as_view(), name="quiz-submit"),
    path("<uuid:quiz_id>/retake/", views.QuizSessionRetakeView.as_view(), name="quiz-retake"),
]