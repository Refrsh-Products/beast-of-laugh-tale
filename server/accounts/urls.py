from django.urls import path
from  . import views

urlpatterns = [
    path('accounts/', views.AccountListAPIView.as_view(), name="accounts-list-create"),
    path('accounts/<uuid:pk>/', views.AccountDetailAPIView.as_view(), name="account-detail-update-delete")
]