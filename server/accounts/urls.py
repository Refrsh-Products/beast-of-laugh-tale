from django.urls import path
from  . import views

urlpatterns = [
    path('accounts/', views.AccountListAPIView.as_view(), name="accounts-list-create"),
    path('accounts/me/', views.AccountDetailAPIView.as_view(), name="account-me"),
    path('accounts/me/usage/', views.AccountUsageAPIView.as_view(), name="account-usage"),
]