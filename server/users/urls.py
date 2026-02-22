from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
