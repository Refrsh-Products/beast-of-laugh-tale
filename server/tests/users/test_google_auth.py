import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status

from tests.factories import UserFactory
from users.models import User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GOOGLE_OAUTH_URL = reverse("users:google-auth")


def make_google_response(email="google_user@example.com", status_code=200):
    """
    Builds a fake requests.Response object that mimics what Google's
    /oauth2/v3/userinfo endpoint returns.

    The view accesses three things on the response:
      - response.status_code  (int)
      - response.text         (str, used only in print statements)
      - response.json()       (dict with user info)

    MagicMock() creates a flexible fake object — we just set those
    three attributes/methods and the view won't know the difference.
    """
    mock = MagicMock()
    mock.status_code = status_code
    mock.text = ""
    mock.json.return_value = {
        "email": email,
        "given_name": "Test",
        "family_name": "User",
        "picture": "https://example.com/photo.jpg",
    }
    return mock


# ---------------------------------------------------------------------------
# Happy paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_google_auth_new_user(api_client):
    """
    Given:  no user exists with this Google email
    When:   POST /auth/google-login/ with a valid Google token
    Then:   200 returned, new user created in DB with registration_method='google'
            and an unusable password (they have no email/password to log in with)
    """
    with patch("users.views.http_requests.get", return_value=make_google_response()):
        response = api_client.post(GOOGLE_OAUTH_URL, {"token": "fake-google-token"})

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["new_user"] is True
    assert "tokens" in data
    assert "access" in data["tokens"]
    assert "refresh" in data["tokens"]
    assert data["user"]["email"] == "google_user@example.com"

    # Verify the user was created correctly in the DB
    user = User.objects.get(email="google_user@example.com")
    assert user.registration_method == "google"
    assert not user.has_usable_password()


@pytest.mark.django_db
def test_google_auth_existing_google_user(api_client):
    """
    Given:  a user who previously signed in via Google
    When:   they sign in with Google again
    Then:   200 returned, new_user=False (existing user, not created)
    """
    existing_user = UserFactory(registration_method="google")
    existing_user.set_unusable_password()
    existing_user.save()

    with patch("users.views.http_requests.get", return_value=make_google_response(email=existing_user.email)):
        response = api_client.post(GOOGLE_OAUTH_URL, {"token": "fake-google-token"})

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["new_user"] is False
    assert "tokens" in data


# ---------------------------------------------------------------------------
# Failure paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_google_auth_existing_email_user_returns_403(api_client, user):
    """
    Given:  a user who registered with email/password (registration_method='email')
    When:   they try to log in via Google with the same email
    Then:   403 — the view blocks it and tells them to use email login

    The 'user' fixture has registration_method='email' by default (see UserFactory).
    """
    with patch("users.views.http_requests.get", return_value=make_google_response(email=user.email)):
        response = api_client.post(GOOGLE_OAUTH_URL, {"token": "fake-google-token"})

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_google_auth_google_api_failure(api_client):
    """
    Given:  Google returns a non-200 response (e.g. invalid or expired token)
    When:   POST /auth/google-login/
    Then:   400 — the view rejects it before touching the DB
    """
    with patch("users.views.http_requests.get", return_value=make_google_response(status_code=401)):
        response = api_client.post(GOOGLE_OAUTH_URL, {"token": "invalid-or-expired-token"})

    assert response.status_code == status.HTTP_400_BAD_REQUEST