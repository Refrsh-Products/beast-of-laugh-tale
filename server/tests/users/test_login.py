import pytest
from django.urls import reverse
from rest_framework import status


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# reverse("users:login") resolves to /auth/login/
# Using reverse() means the test won't break if the URL path ever changes.
LOGIN_URL = reverse("users:login")

# The default password set by UserFactory
DEFAULT_PASSWORD = "TestPassword123!"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_login_valid_credentials_returns_200_and_tokens(api_client, user):
    """
    Given:  a registered user
    When:   POST /auth/login/ with correct email + password
    Then:   response is 200, body contains access + refresh tokens and user data
    """
    payload = {
        "email": user.email,
        "password": DEFAULT_PASSWORD,
    }

    response = api_client.post(LOGIN_URL, payload)

    assert response.status_code == status.HTTP_200_OK

    data = response.json()

    # tokens must be present
    assert "tokens" in data
    assert "access" in data["tokens"]
    assert "refresh" in data["tokens"]

    # user object must be present and correct
    assert "user" in data
    assert data["user"]["email"] == user.email


# ---------------------------------------------------------------------------
# Failure paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_login_wrong_password_returns_401(api_client, user):
    """
    Given:  a registered user
    When:   POST /auth/login/ with the correct email but the wrong password
    Then:   response is 401 — credentials rejected, no tokens issued
    """
    payload = {
        "email": user.email,
        "password": "WrongPassword999!",
    }

    response = api_client.post(LOGIN_URL, payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "tokens" not in response.json()


@pytest.mark.django_db
def test_login_nonexistent_email_returns_401(api_client):
    """
    Given:  no user exists with this email
    When:   POST /auth/login/
    Then:   401 — same response as wrong password (no info leakage)

    Note: we don't use the 'user' fixture here because we want no user in the DB.
    """
    payload = {
        "email": "nobody@example.com",
        "password": DEFAULT_PASSWORD,
    }

    response = api_client.post(LOGIN_URL, payload)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_login_missing_password_returns_400(api_client, user):
    """
    Given:  a payload with no password field
    When:   POST /auth/login/
    Then:   400 — the LoginSerializer rejects it before we even check credentials
    """
    payload = {"email": user.email}  # password intentionally omitted

    response = api_client.post(LOGIN_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_login_invalid_email_format_returns_400(api_client):
    """
    Given:  a payload where email is not a valid email address
    When:   POST /auth/login/
    Then:   400 — DRF's EmailField rejects it at the serializer level
    """
    payload = {
        "email": "not-an-email",
        "password": DEFAULT_PASSWORD,
    }

    response = api_client.post(LOGIN_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST