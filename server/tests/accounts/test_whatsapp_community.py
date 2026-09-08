"""
Tests for the WhatsApp community opt-in.

The feature is only ever "show an invite link, record that the user opened it" —
no API can add a person to a WhatsApp group, so `whatsapp_community_opt_in_at` is
a consent record and never a membership record.

Two invariants carry the whole design and are pinned hardest here:

  1. `enabled` on the wire means "on AND openable". Both clients decide whether
     to show the community step purely from that flag, so enabled-without-a-link
     must read as disabled.
  2. Nothing but POST /accounts/me/community/ may write the timestamp. The web
     profile screen PATCHes a whole spread account object on every inline edit,
     so a writable field would be both forgeable and clobberable.
"""

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone

from accounts.models import Account, WhatsAppCommunitySettings
from accounts.services.account import ensure_account
from tests.factories import AccountFactory

pytestmark = pytest.mark.django_db

COMMUNITY = reverse("account-community")
ACCOUNT_ME = reverse("account-me")
ACCOUNTS = reverse("accounts-list-create")

INVITE = "https://chat.whatsapp.com/AbCdEf123456"


def _enable(invite_url=INVITE, **kwargs):
    settings_row = WhatsAppCommunitySettings.load()
    settings_row.enabled = True
    settings_row.invite_url = invite_url
    for key, value in kwargs.items():
        setattr(settings_row, key, value)
    settings_row.save()
    return settings_row


def test_community_requires_authentication(api_client):
    assert api_client.get(COMMUNITY).status_code == 401


def test_get_creates_singleton_and_reports_disabled(authenticated_client, user):
    AccountFactory(user=user)

    response = authenticated_client.get(COMMUNITY)

    assert response.status_code == 200
    assert response.data["enabled"] is False
    assert response.data["invite_url"] == ""
    assert response.data["opted_in_at"] is None
    assert WhatsAppCommunitySettings.objects.count() == 1


def test_get_reports_live_settings(authenticated_client, user):
    AccountFactory(user=user)
    _enable(headline="Join us", message="Come say hi")

    response = authenticated_client.get(COMMUNITY)

    assert response.data["enabled"] is True
    assert response.data["invite_url"] == INVITE
    assert response.data["headline"] == "Join us"
    assert response.data["message"] == "Come say hi"


def test_enabled_without_invite_url_reads_as_disabled(authenticated_client, user):
    """The contract both clients' skip logic depends on."""
    AccountFactory(user=user)
    _enable(invite_url="")

    response = authenticated_client.get(COMMUNITY)

    assert response.data["enabled"] is False
    assert response.data["invite_url"] == ""


def test_post_records_opt_in_and_returns_invite_url(authenticated_client, user):
    AccountFactory(user=user)
    _enable()

    response = authenticated_client.post(COMMUNITY)

    assert response.status_code == 200
    assert response.data["invite_url"] == INVITE
    assert response.data["opted_in_at"] is not None
    assert Account.objects.get(user=user).whatsapp_community_opt_in_at is not None


def test_post_is_idempotent(authenticated_client, user):
    """Re-tapping from the account screen must not rewrite the original consent."""
    AccountFactory(user=user)
    _enable()

    first = authenticated_client.post(COMMUNITY).data["opted_in_at"]
    second = authenticated_client.post(COMMUNITY).data["opted_in_at"]

    assert first == second


def test_post_succeeds_when_community_disabled(authenticated_client, user):
    """Ops flipping the toggle between the client's GET and POST must not error."""
    AccountFactory(user=user)

    response = authenticated_client.post(COMMUNITY)

    assert response.status_code == 200
    assert response.data["invite_url"] == ""
    assert Account.objects.get(user=user).whatsapp_community_opt_in_at is not None


def test_post_creates_account_when_missing(authenticated_client, user):
    assert not Account.objects.filter(user=user).exists()

    response = authenticated_client.post(COMMUNITY)

    assert response.status_code == 200
    account = Account.objects.get(user=user)
    assert account.whatsapp_community_opt_in_at is not None
    # The stub must not accidentally mark them onboarded.
    assert account.onboarding_completed is False


def test_get_without_account_row_does_not_create_one(authenticated_client, user):
    response = authenticated_client.get(COMMUNITY)

    assert response.status_code == 200
    assert response.data["opted_in_at"] is None
    assert Account.objects.count() == 0


def test_delete_clears_the_opt_in(authenticated_client, user):
    AccountFactory(user=user, whatsapp_community_opt_in_at=timezone.now())

    response = authenticated_client.delete(COMMUNITY)

    assert response.status_code == 200
    assert response.data["opted_in_at"] is None
    assert Account.objects.get(user=user).whatsapp_community_opt_in_at is None


def test_patch_account_me_cannot_forge_opt_in(authenticated_client, user):
    AccountFactory(user=user)

    response = authenticated_client.patch(
        ACCOUNT_ME,
        {"whatsapp_community_opt_in_at": "2020-01-01T00:00:00Z"},
        format="json",
    )

    assert response.status_code == 200
    assert Account.objects.get(user=user).whatsapp_community_opt_in_at is None


def test_post_accounts_cannot_forge_opt_in(authenticated_client, user):
    response = authenticated_client.post(
        ACCOUNTS,
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "phone": "01700000000",
            "whatsapp_community_opt_in_at": "2020-01-01T00:00:00Z",
        },
        format="json",
    )

    assert response.status_code == 201
    assert Account.objects.get(user=user).whatsapp_community_opt_in_at is None


def test_patch_does_not_clobber_existing_opt_in(authenticated_client, user):
    """The real regression: the web profile screen PATCHes a whole account object."""
    stamped = timezone.now()
    AccountFactory(user=user, whatsapp_community_opt_in_at=stamped)

    response = authenticated_client.patch(
        ACCOUNT_ME,
        {"whatsapp_community_opt_in_at": None, "phone": "01888888888"},
        format="json",
    )

    assert response.status_code == 200
    account = Account.objects.get(user=user)
    assert account.phone == "01888888888"
    assert account.whatsapp_community_opt_in_at == stamped


def test_account_me_exposes_opt_in_at(authenticated_client, user):
    AccountFactory(user=user, whatsapp_community_opt_in_at=timezone.now())

    response = authenticated_client.get(ACCOUNT_ME)

    assert response.data["whatsapp_community_opt_in_at"] is not None


def test_opt_in_defaults_to_null():
    assert AccountFactory().whatsapp_community_opt_in_at is None


def test_invite_url_must_be_a_whatsapp_invite():
    settings_row = WhatsAppCommunitySettings.load()

    settings_row.invite_url = "https://evil.example/phishing"
    with pytest.raises(ValidationError):
        settings_row.full_clean()

    # Blank is allowed — that's how the feature ships dark.
    settings_row.invite_url = ""
    settings_row.full_clean()

    settings_row.invite_url = INVITE
    settings_row.full_clean()


def test_settings_singleton_is_pinned_and_undeletable():
    first = WhatsAppCommunitySettings.load()
    first.enabled = True
    first.save()

    second = WhatsAppCommunitySettings()
    second.save()

    assert WhatsAppCommunitySettings.objects.count() == 1
    with pytest.raises(NotImplementedError):
        WhatsAppCommunitySettings.load().delete()


def test_ensure_account_leaves_opt_in_untouched(user):
    account = ensure_account(user)

    assert account.whatsapp_community_opt_in_at is None
