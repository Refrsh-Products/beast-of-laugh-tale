import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status

from users.models import User
from users.services.unsubscribe import (
    make_unsubscribe_token,
    unsubscribe_by_token,
)
from users.services.promotional_email import send_promotional_email
from tests.factories import UserFactory

UNSUBSCRIBE_URL = reverse("users:unsubscribe")


def _one_click_url(token):
    return reverse("users:unsubscribe-one-click", kwargs={"token": token})


# ---------------------------------------------------------------------------
# Token service
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_valid_token_marks_user_unsubscribed():
    """A valid token flips marketing_unsubscribed_at from null to a timestamp."""
    user = UserFactory(email="promo@example.com")
    assert user.marketing_unsubscribed_at is None

    assert unsubscribe_by_token(make_unsubscribe_token("promo@example.com")) is True

    user.refresh_from_db()
    assert user.marketing_unsubscribed_at is not None


@pytest.mark.django_db
def test_token_matches_by_normalized_email():
    """A token minted for a Gmail alias resolves to the same underlying inbox."""
    user = UserFactory(email="john.doe@gmail.com")

    assert unsubscribe_by_token(make_unsubscribe_token("johndoe+promo@gmail.com")) is True

    user.refresh_from_db()
    assert user.marketing_unsubscribed_at is not None


@pytest.mark.django_db
def test_tampered_token_rejected():
    """A garbled token is rejected and no user is changed."""
    user = UserFactory(email="promo@example.com")
    token = make_unsubscribe_token("promo@example.com")

    assert unsubscribe_by_token(token + "tampered") is False

    user.refresh_from_db()
    assert user.marketing_unsubscribed_at is None


@pytest.mark.django_db
def test_garbage_token_rejected():
    assert unsubscribe_by_token("not-a-real-token") is False


@pytest.mark.django_db
def test_non_user_token_is_noop_success():
    """A token for an address with no account succeeds without raising."""
    assert unsubscribe_by_token(make_unsubscribe_token("stranger@example.com")) is True


@pytest.mark.django_db
def test_idempotent_does_not_overwrite_timestamp():
    """Unsubscribing twice keeps the original timestamp — it's a no-op the 2nd time."""
    user = UserFactory(email="promo@example.com")
    token = make_unsubscribe_token("promo@example.com")

    unsubscribe_by_token(token)
    user.refresh_from_db()
    first = user.marketing_unsubscribed_at

    unsubscribe_by_token(token)
    user.refresh_from_db()
    assert user.marketing_unsubscribed_at == first


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_unsubscribe_endpoint_valid_token(api_client):
    UserFactory(email="promo@example.com")
    token = make_unsubscribe_token("promo@example.com")

    response = api_client.post(UNSUBSCRIBE_URL, {"token": token}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert User.objects.get(email="promo@example.com").marketing_unsubscribed_at is not None


@pytest.mark.django_db
def test_unsubscribe_endpoint_invalid_token(api_client):
    response = api_client.post(UNSUBSCRIBE_URL, {"token": "bogus"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_unsubscribe_endpoint_is_public(api_client):
    """No auth required — the signed token is the credential."""
    UserFactory(email="promo@example.com")
    token = make_unsubscribe_token("promo@example.com")
    response = api_client.post(UNSUBSCRIBE_URL, {"token": token}, format="json")
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_one_click_endpoint_unsubscribes(api_client):
    """RFC 8058 one-click: a bodyless POST to the token URL opts the user out."""
    UserFactory(email="promo@example.com")
    token = make_unsubscribe_token("promo@example.com")

    response = api_client.post(_one_click_url(token))

    assert response.status_code == status.HTTP_200_OK
    assert User.objects.get(email="promo@example.com").marketing_unsubscribed_at is not None


@pytest.mark.django_db
def test_one_click_endpoint_swallows_bad_token(api_client):
    """One-click always 200s — providers only need a success signal."""
    response = api_client.post(_one_click_url("garbage"))
    assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Suppression at send time
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_promotional_send_skips_unsubscribed_recipients():
    """Opted-out users are dropped into `skipped`; everyone else still gets mail,
    with a per-recipient unsubscribe link and List-Unsubscribe headers."""
    UserFactory(email="in@example.com")
    opted_out = UserFactory(email="out@example.com")
    unsubscribe_by_token(make_unsubscribe_token("out@example.com"))
    opted_out.refresh_from_db()
    assert opted_out.marketing_unsubscribed_at is not None

    with patch("users.services.promotional_email.email_service.send_template_email") as mock_send:
        sent, failed, skipped = send_promotional_email(
            recipients=["in@example.com", "out@example.com"],
            subject="Deal",
            context={"heading": "Big news"},
        )

    assert sent == ["in@example.com"]
    assert failed == []
    assert skipped == ["out@example.com"]

    assert mock_send.call_count == 1
    call = mock_send.call_args_list[0]
    assert call.kwargs["to"] == "in@example.com"
    assert "unsubscribe_url" in call.kwargs["context"]
    headers = call.kwargs["extra_headers"]
    assert "List-Unsubscribe" in headers
    assert headers["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
