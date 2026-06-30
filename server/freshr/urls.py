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
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView
from drf_spectacular.views import SpectacularSwaggerView
from drf_spectacular.views import SpectacularRedocView
from rest_framework_simplejwt import views as jwt_views

api_urlpatterns = [
    path('users/', include('accounts.urls')),
    path('notebooks/', include(("notebooks.urls", "notebooks"), namespace="notebooks")),
    path('rag/', include(("rag.urls", "rag"), namespace="rag")),
    path('chats/', include(("chats.urls", "chats"), namespace="chats")),
    path('presentation/', include(("presentation.urls", "presentation"), namespace="presentation")),
    path('quizzes/', include(("quiz.urls","quiz"), namespace="quiz")),
    path('transcription/', include(("transcription.urls", "transcription"), namespace="transcription")),

    path('payments/', include(("payments.urls", "payments"), namespace="payments")),
    path('policies/', include(("policies.urls", "policies"), namespace="policies")),
    path('referral/', include(("campus_champions.urls", "campus_champions"), namespace="campus_champions")),

    # authentication endpoints
    path('auth/', include('users.urls')),
    path('auth/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns = [
    # The `api/` prefix is what nginx proxies to Django (everything else falls
    # through to the SPA). `v{API_VERSION}` is the contract version underneath
    # it — see API_VERSION in settings. Result: /api/v1/...
    path(f'api/v{settings.API_VERSION}/', include(api_urlpatterns)),

    # Kept outside /api/ so nginx's SPA fallback hides them in production —
    # only reachable when hitting Django directly (i.e. local dev on :8000).
    path('admin/', admin.site.urls),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redocs/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
