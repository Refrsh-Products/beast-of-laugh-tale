from django.urls import path
from .views import QueryVectorDBAPIView

urlpatterns = [
    path("query/", QueryVectorDBAPIView.as_view(), name="query"),
]
