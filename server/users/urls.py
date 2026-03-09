from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('google-login/', views.GoogleAuth.as_view(), name='google-auth'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
