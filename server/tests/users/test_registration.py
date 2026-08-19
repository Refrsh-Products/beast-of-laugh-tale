import pytest
import factory
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status

from users.models import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Using reverse() means the test won't break if the URL path ever changes.
REGISTER_URL = reverse("users:register")

# The default password set by UserFactory
DEFAULT_EMAIL = "test_user@gmail.com"
DEFAULT_PASSWORD = "TestPassword123!"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_register_success(api_client):
    """
    Given:  an unregistered user
    When:   POST /auth/register/
    Then:   a new user is creted and appropriate status with user information is returned
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    response = api_client.post(REGISTER_URL, payload)

    # check if 201 created
    assert response.status_code == status.HTTP_201_CREATED

    data = response.json()
    
    # check if tokens present
    assert "tokens" in data
    assert "access" in data["tokens"]
    assert "refresh" in data["tokens"]

    # check if user created
    assert data["user"]["email"] == DEFAULT_EMAIL
    assert "id" in data["user"]

    user_in_db = User.objects.get(email=DEFAULT_EMAIL)
    assert user_in_db.email == DEFAULT_EMAIL
    assert user_in_db.check_password(DEFAULT_PASSWORD)

    # check if password hashed
    assert user_in_db.password != DEFAULT_PASSWORD
    
"""
Duplicate email — register with the same email twice → 400
Case-insensitive duplicate — register with User@example.com when user@example.com already exists → 400
Mismatched passwords — password ≠ password_confirm → 400
Weak password — e.g. "password" or "12345" → 400 (Django validators)
"""

# ---------------------------------------------------------------------------
# Failure paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_register_duplicate_email_case_insensitive(api_client):
    """
    Given:  An existing registered user in the system
    When:   Registering a new user with the same email (identical or different case)
    Then:   The API returns 400 Bad Request and prevents duplicate account creation
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    response = api_client.post(REGISTER_URL, payload)

    assert response.status_code == status.HTTP_201_CREATED, 'Frist registration should succeed'
    
    # register another user with the same email
    response = api_client.post(REGISTER_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # emails should be case insensitive
    payload = {
        "email": DEFAULT_EMAIL.upper(),
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    response = api_client.post(REGISTER_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_register_password_mismatch(api_client):
    """
    Given:  an unregistered user, with mismatched password
    When:   POST /auth/register/
    Then:   400 - password ≠ password_confirm
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": "MissMatchedPassword!123"
    }
    response = api_client.post(REGISTER_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.django_db
def test_register_weak_password(api_client):
    """
    Given:  an unregistered user with weak password
    When:   POST /auth/register/
    Then:   400 - Weak password
    """
    weak_passwords = ["password123", "qwertyuiop", "12345678", "secret"]

    for weak_pass in weak_passwords:
        payload = {
            "email": DEFAULT_EMAIL,
            "password": weak_pass,
            "password_confirm": weak_pass,
        }
        response = api_client.post(REGISTER_URL, payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Welcome email
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_register_sends_welcome_email_once(api_client):
    """
    Given:  an unregistered email
    When:   POST /auth/register/
    Then:   the welcome email is sent exactly once for the newly created account

    Both the welcome and verification sends are mocked so no real network call
    to Resend happens during the test.
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    with patch("users.views.send_welcome_email") as mock_welcome, \
         patch("users.views.send_verification_email") as mock_verify:
        response = api_client.post(REGISTER_URL, payload)

    assert response.status_code == status.HTTP_201_CREATED
    mock_welcome.assert_called_once()
    mock_verify.assert_called_once()

    (welcomed_user,), _ = mock_welcome.call_args
    assert welcomed_user.email == DEFAULT_EMAIL


@pytest.mark.django_db
def test_register_resend_does_not_resend_welcome_email(api_client):
    """
    Given:  an existing but unverified account (lost their verification email)
    When:   they submit the registration form again with the same email
    Then:   the verification email is resent, but the welcome email is NOT —
            they already received it on the first registration.
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    with patch("users.views.send_welcome_email"), \
         patch("users.views.send_verification_email"):
        first = api_client.post(REGISTER_URL, payload)
    assert first.status_code == status.HTTP_201_CREATED

    with patch("users.views.send_welcome_email") as mock_welcome, \
         patch("users.views.send_verification_email") as mock_verify:
        second = api_client.post(REGISTER_URL, payload)

    assert second.status_code == status.HTTP_201_CREATED
    mock_welcome.assert_not_called()
    mock_verify.assert_called_once()