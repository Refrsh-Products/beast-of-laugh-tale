from django.urls import path
from  . import views

urlpatterns = [
    path('accounts/', views.AccountsView.as_view(), name="accounts")
]