import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status

from tests.factories import UserFactory

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PROMOTIONAL_EMAIL_URL = reverse("users:promotional-email-send")

VALID_PAYLOAD = {
    "recipients": ["a@example.com", "b@example.com"],
    "subject": "New in freshr",
    "eyebrow": "Product update",
    "heading": "Automations are live",
    "body": "You can now set rules that run in the background.",
    "cta_text": "Set up automations",
    "cta_url": "https://freshr.cc/features/automations",
}


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_promotional_email_requires_auth(api_client):
    """
    Given:  no authenticated user
    When:   POST /auth/promotional-email/send/
    Then:   401/403 — this is a staff-only, manually-initiated send
    """
    response = api_client.post(PROMOTIONAL_EMAIL_URL, VALID_PAYLOAD, format="json")
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.django_db
def test_promotional_email_requires_staff(api_client, user):
    """
    Given:  a regular (non-staff) authenticated user
    When:   POST /auth/promotional-email/send/
    Then:   403 — only staff can trigger a promotional campaign send
    """
    api_client.force_authenticate(user=user)
    response = api_client.post(PROMOTIONAL_EMAIL_URL, VALID_PAYLOAD, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_promotional_email_sent_by_staff(api_client):
    """
    Given:  a staff user and a list of recipients
    When:   POST /auth/promotional-email/send/ with editable content fields
    Then:   200, one email sent per recipient using the promotional template,
            and the response reports which addresses succeeded
    """
    staff_user = UserFactory(is_staff=True)
    api_client.force_authenticate(user=staff_user)

    with patch("users.services.promotional_email.email_service.send_template_email") as mock_send:
        response = api_client.post(PROMOTIONAL_EMAIL_URL, VALID_PAYLOAD, format="json")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["sent"] == VALID_PAYLOAD["recipients"]
    assert data["failed"] == []

    assert mock_send.call_count == len(VALID_PAYLOAD["recipients"])
    sent_to = {call.kwargs["to"] for call in mock_send.call_args_list}
    assert sent_to == set(VALID_PAYLOAD["recipients"])
    for call in mock_send.call_args_list:
        assert call.kwargs["template_name"] == "emails/promotional.html"
        assert call.kwargs["context"]["heading"] == VALID_PAYLOAD["heading"]


@pytest.mark.django_db
def test_promotional_email_partial_failure_does_not_abort_batch(api_client):
    """
    Given:  a staff user sending to multiple recipients
    When:   the underlying send raises for one recipient
    Then:   the other recipients still get their email, and the failed address
            is reported back instead of the whole request erroring out
    """
    staff_user = UserFactory(is_staff=True)
    api_client.force_authenticate(user=staff_user)

    def side_effect(to, **kwargs):
        if to == "b@example.com":
            raise Exception("simulated Resend API failure")

    with patch(
        "users.services.promotional_email.email_service.send_template_email",
        side_effect=side_effect,
    ) as mock_send:
        response = api_client.post(PROMOTIONAL_EMAIL_URL, VALID_PAYLOAD, format="json")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["sent"] == ["a@example.com"]
    assert data["failed"] == ["b@example.com"]
    assert mock_send.call_count == 2


@pytest.mark.django_db
def test_promotional_email_requires_recipients(api_client):
    """
    Given:  a staff user
    When:   POST with an empty recipients list
    Then:   400 — the serializer rejects an empty send
    """
    staff_user = UserFactory(is_staff=True)
    api_client.force_authenticate(user=staff_user)

    payload = {**VALID_PAYLOAD, "recipients": []}
    response = api_client.post(PROMOTIONAL_EMAIL_URL, payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
