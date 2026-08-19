import pytest
from unittest.mock import patch
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import status

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PASSWORD_RESET_URL = reverse("users:password-reset")
PASSWORD_RESET_CONFIRM_URL = reverse("users:password-reset-confirm")
DEFAULT_PASSWORD = "TestPassword123!"
NEW_PASSWORD = "NewSecurePassword456!"


def make_uid_and_token(user):
    """
    Generate the uid + token pair exactly the way PasswordResetRequestView does.
    We reuse this in multiple tests to build valid confirm payloads.
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token


# ---------------------------------------------------------------------------
# Password reset REQUEST tests  (POST /auth/password-reset/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_password_reset_request_existing_email(api_client, user):
    """
    Given:  a registered user
    When:   POST /auth/password-reset/ with their email
    Then:   200 is returned and send_template_email was called once with the right recipient

    We mock send_template_email so no real email is sent during the test.
    'patch' temporarily replaces the real function with a fake (MagicMock).
    After the 'with' block, it is restored to the real function.
    """
    with patch("users.views.email_service.send_template_email") as mock_send_email:
        response = api_client.post(PASSWORD_RESET_URL, {"email": user.email})

    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()

    # Verify the email was actually sent (not skipped)
    mock_send_email.assert_called_once()

    # Verify it was sent to the right address using the new password_reset template
    _, kwargs = mock_send_email.call_args
    assert kwargs.get("to") == user.email
    assert kwargs.get("template_name") == "emails/password_reset.html"


@pytest.mark.django_db
def test_password_reset_request_nonexistent_email(api_client):
    """
    Given:  an email that belongs to no registered user
    When:   POST /auth/password-reset/
    Then:   still returns 200 — the view deliberately hides whether the email exists
            to prevent attackers from enumerating valid accounts

    send_template_email must NOT be called since there is no user to email.
    """
    with patch("users.views.email_service.send_template_email") as mock_send_email:
        response = api_client.post(PASSWORD_RESET_URL, {"email": "nobody@example.com"})

    assert response.status_code == status.HTTP_200_OK
    mock_send_email.assert_not_called()


# ---------------------------------------------------------------------------
# Password reset CONFIRM tests  (POST /auth/password-reset/confirm/)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_password_reset_confirm_valid(api_client, user):
    """
    Given:  a valid uid + token generated for a registered user
    When:   POST /auth/password-reset/confirm/ with a strong new password
    Then:   200 returned, user can now log in with the new password
    """
    uid, token = make_uid_and_token(user)

    payload = {
        "uid": uid,
        "token": token,
        "new_password": NEW_PASSWORD,
        "new_password_confirm": NEW_PASSWORD,
    }
    response = api_client.post(PASSWORD_RESET_CONFIRM_URL, payload)

    assert response.status_code == status.HTTP_200_OK

    # Reload the user from the DB — the in-memory object still has the old password
    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)
    assert not user.check_password(DEFAULT_PASSWORD)


@pytest.mark.django_db
def test_password_reset_confirm_invalid_token(api_client, user):
    """
    Given:  a valid uid but a tampered/incorrect token
    When:   POST /auth/password-reset/confirm/
    Then:   400 — Django's token checker rejects it
    """
    uid, _ = make_uid_and_token(user)

    payload = {
        "uid": uid,
        "token": "completely-invalid-token",
        "new_password": NEW_PASSWORD,
        "new_password_confirm": NEW_PASSWORD,
    }
    response = api_client.post(PASSWORD_RESET_CONFIRM_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_password_reset_confirm_expired_token(api_client, user):
    """
    Given:  a valid token, but Django's token checker returns False (simulating expiry)
    When:   POST /auth/password-reset/confirm/
    Then:   400 — the view rejects it

    We mock check_token directly instead of faking the clock — this tests
    the view's response to a failed token check without any time travel library.
    """
    uid, token = make_uid_and_token(user)

    payload = {
        "uid": uid,
        "token": token,
        "new_password": NEW_PASSWORD,
        "new_password_confirm": NEW_PASSWORD,
    }

    with patch.object(default_token_generator, "check_token", return_value=False):
        response = api_client.post(PASSWORD_RESET_CONFIRM_URL, payload)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
