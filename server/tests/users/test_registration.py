import pytest
import factory
from unittest.mock import patch
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status

from tests.factories import UserFactory
from users.models import User
from users.tokens import email_verification_token


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Using reverse() means the test won't break if the URL path ever changes.
REGISTER_URL = reverse("users:register")
VERIFY_CONFIRM_URL = reverse("users:verify-email-confirm")

# The default password set by UserFactory
DEFAULT_EMAIL = "test_user@gmail.com"
DEFAULT_PASSWORD = "TestPassword123!"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------
@pytest.mark.django_db
def test_register_success(api_client, mailoutbox):
    """
    When a new user registers for an account, they are send a verification email, so that users cannot create account using fake emails.
    They are no longer sent JWT tokens right after creating an account.

    Given:  an unregistered user
    When:   POST /auth/register/
    Then:   a new user with is_active=False is creted and verification email is sent
    """
    payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    response = api_client.post(REGISTER_URL, payload, format='json')

    # 201 Created with the "check your email" confirmation message
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["message"] == "Account created. Check your email to verify your account."

    # No JWT tokens are issued at registration — they come after verification.
    assert "access" not in data
    assert "refresh" not in data

    # Only the verification email goes out at registration. The welcome email
    # is deferred until the account is verified (EmailVerificationConfirmView).
    assert len(mailoutbox) == 1, "verification email only"
    verification = mailoutbox[0]
    assert verification.to == [DEFAULT_EMAIL]
    assert verification.subject == "Verify your email address"
    assert "/verify-email?uid=" in verification.body
    assert "token=" in verification.body

    # The user is persisted, with a hashed password and inactive until verified.
    user_in_db = User.objects.get(email=DEFAULT_EMAIL)
    assert user_in_db.email == DEFAULT_EMAIL
    assert user_in_db.check_password(DEFAULT_PASSWORD)
    assert user_in_db.is_active is False

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
    Given:  An existing *verified* user in the system
    When:   Registering a new user with the same email (identical or different case)
    Then:   The API returns 400 Bad Request and prevents duplicate account creation
    """
    user = UserFactory(email=DEFAULT_EMAIL, password=DEFAULT_PASSWORD, is_active=True)
    
    # attempt to register again with the same email (all upper case)
    payload = {
        "email": DEFAULT_EMAIL.upper(),
        "password": DEFAULT_PASSWORD,
        "password_confirm": DEFAULT_PASSWORD,
    }
    response = api_client.post(REGISTER_URL, payload, format='json')

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["error"].lower()


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
def test_register_does_not_send_welcome_email(api_client):
    """
    Given:  an unregistered email
    When:   POST /auth/register/
    Then:   only the verification email is sent — the welcome email is deferred
            until the user verifies their account (EmailVerificationConfirmView),
            so we never welcome an address that may never be confirmed.

    Both sends are mocked so no real network call to Resend happens.
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
    mock_verify.assert_called_once()
    mock_welcome.assert_not_called()

    (verified_user,), _ = mock_verify.call_args
    assert verified_user.email == DEFAULT_EMAIL


# ---------------------------------------------------------------------------
# Verification confirm — where the welcome email now lives
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_verify_confirm_activates_and_sends_welcome_email(api_client):
    """
    Given:  an unverified account with a valid verification link
    When:   POST /auth/verify-email/confirm/ with the uid + token
    Then:   the account is activated and the welcome email is sent exactly once —
            this is the send that used to happen at registration.
    """
    user = UserFactory(email=DEFAULT_EMAIL, is_active=False)
    payload = {
        "uid": urlsafe_base64_encode(force_bytes(str(user.pk))),
        "token": email_verification_token.make_token(user),
    }

    with patch("users.views.send_welcome_email") as mock_welcome:
        response = api_client.post(VERIFY_CONFIRM_URL, payload, format="json")

    assert response.status_code == status.HTTP_200_OK

    user.refresh_from_db()
    assert user.is_active is True

    mock_welcome.assert_called_once()
    (welcomed_user,), _ = mock_welcome.call_args
    assert welcomed_user.pk == user.pk