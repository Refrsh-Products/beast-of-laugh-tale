"""
URL configuration for freshr project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView
from drf_spectacular.views import SpectacularSwaggerView
from drf_spectacular.views import SpectacularRedocView
from rest_framework_simplejwt import views as jwt_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('accounts.urls')),
    path('notebooks/', include(("notebooks.urls", "notebooks"), namespace="notebooks")),
    path('rag/', include(("rag.urls", "rag"), namespace="rag")),
    path('chats/', include(("chats.urls", "chats"), namespace="chats")),
    # path('presentation/', include(("presentation.urls", "presentation"), namespace="presentation")),
    # path('quiz/', include(("quiz.urls","quiz"), namespace="quiz")),
    # path('flashcard/', include(("flashcard.urls","flashcard"), namespace="flashcard")),

    path('payments/', include(("payments.urls", "payments"), namespace="payments")),

    # authentication endpoints
    path('auth/', include('users.urls')),
    path('auth/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),

    # swagger stuffs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redocs/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
