"""
Tests for the onboarding/profile fields on Account.

Onboarding stopped asking for a postal address and started asking for a
university and a year of study. That made three previously-required columns
optional and added two new optional ones, so this file pins down the contract
the onboarding forms depend on:

  - a payload with no address at all is accepted, on both PATCH and POST
  - `university` is free text (the client's "Other" escape hatch relies on the
    server doing no choice validation)
  - `year_of_study` is validated against its choices, but accepts blank

The POST case matters most: it's the fallback mobile takes when PATCH
/accounts/me/ 404s, and it's the one path that would 400 and strand a user
behind the hard onboarding gate if the columns were still required.
"""

import pytest
from django.urls import reverse

from accounts.models import Account, YearOfStudy
from accounts.services.account import ensure_account
from tests.factories import AccountFactory

pytestmark = pytest.mark.django_db

ACCOUNT_ME = reverse("account-me")
ACCOUNTS = reverse("accounts-list-create")

# What the onboarding form sends now that the address fields are gone.
ONBOARDING_PAYLOAD = {
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "01700000000",
    "university": "BRAC University",
    "year_of_study": YearOfStudy.YEAR_2,
    "onboarding_completed": True,
}


def test_patch_succeeds_without_address_fields(authenticated_client, user):
    account = AccountFactory(user=user)

    response = authenticated_client.patch(ACCOUNT_ME, ONBOARDING_PAYLOAD, format="json")

    assert response.status_code == 200
    account.refresh_from_db()
    assert account.onboarding_completed is True
    assert account.first_name == "Jane"
    # A partial update must leave the omitted address alone rather than
    # overwriting it with the new model default.
    assert account.address1 == "123 Test St"
    assert account.city == "Dhaka"


def test_patch_from_blank_stub_account_succeeds(authenticated_client, user):
    """The real onboarding path: ensure_account() made an empty row at signup."""
    account = ensure_account(user)
    assert account.address1 == ""

    response = authenticated_client.patch(ACCOUNT_ME, ONBOARDING_PAYLOAD, format="json")

    assert response.status_code == 200
    account.refresh_from_db()
    assert account.onboarding_completed is True
    assert account.address1 == ""
    assert account.university == "BRAC University"


def test_university_accepts_free_text(authenticated_client, user):
    """The whole point of the client's "Other" row — no server-side validation."""
    AccountFactory(user=user)

    response = authenticated_client.patch(
        ACCOUNT_ME, {"university": "Some Tiny College Nobody Listed"}, format="json"
    )

    assert response.status_code == 200
    assert (
        Account.objects.get(user=user).university == "Some Tiny College Nobody Listed"
    )


def test_university_accepts_curated_name_with_comma(authenticated_client, user):
    AccountFactory(user=user)
    name = "Independent University, Bangladesh (IUB)"

    response = authenticated_client.patch(
        ACCOUNT_ME, {"university": name}, format="json"
    )

    assert response.status_code == 200
    assert Account.objects.get(user=user).university == name


@pytest.mark.parametrize("value", YearOfStudy.values)
def test_year_of_study_accepts_each_valid_choice(authenticated_client, user, value):
    AccountFactory(user=user)

    response = authenticated_client.patch(
        ACCOUNT_ME, {"year_of_study": value}, format="json"
    )

    assert response.status_code == 200
    assert Account.objects.get(user=user).year_of_study == value


def test_year_of_study_rejects_invalid_choice(authenticated_client, user):
    AccountFactory(user=user)

    response = authenticated_client.patch(
        ACCOUNT_ME, {"year_of_study": "FIFTH_YEAR"}, format="json"
    )

    assert response.status_code == 400
    assert "year_of_study" in response.data


def test_year_of_study_accepts_blank(authenticated_client, user):
    """`blank=True` on the model must reach DRF as allow_blank on the ChoiceField."""
    AccountFactory(user=user, year_of_study=YearOfStudy.YEAR_3)

    response = authenticated_client.patch(
        ACCOUNT_ME, {"year_of_study": ""}, format="json"
    )

    assert response.status_code == 200
    assert Account.objects.get(user=user).year_of_study == ""


def test_new_fields_default_to_blank():
    account = AccountFactory()

    assert account.university == ""
    assert account.year_of_study == ""


def test_get_me_exposes_new_fields(authenticated_client, user):
    """The shared AccountMeResponse mapping reads both keys off every response."""
    AccountFactory(user=user, university="North South University (NSU)",
                   year_of_study=YearOfStudy.GRADUATED)

    response = authenticated_client.get(ACCOUNT_ME)

    assert response.status_code == 200
    assert response.data["university"] == "North South University (NSU)"
    assert response.data["year_of_study"] == YearOfStudy.GRADUATED


def test_quota_counters_are_not_writable(authenticated_client, user):
    """`fields = '__all__'` once left these writable, which let any authenticated
    user reset their own limits — quota.check_storage_quota reads
    storage_bytes_used and check_presentation_quota reads presentations_generated.
    """
    AccountFactory(user=user, storage_bytes_used=5_000_000, presentations_generated=7)

    response = authenticated_client.patch(
        ACCOUNT_ME,
        {"storage_bytes_used": 0, "presentations_generated": 0},
        format="json",
    )

    assert response.status_code == 200
    account = Account.objects.get(user=user)
    assert account.storage_bytes_used == 5_000_000
    assert account.presentations_generated == 7


def test_post_accounts_without_address_completes_onboarding(authenticated_client, user):
    """Mobile's fallback when PATCH /accounts/me/ 404s (no row yet).

    POST is not a partial update, so before the address fields were made
    optional this payload 400'd on address1/city/postal_code — leaving the user
    stuck behind the hard onboarding gate with a generic error.
    """
    response = authenticated_client.post(ACCOUNTS, ONBOARDING_PAYLOAD, format="json")

    assert response.status_code == 201
    account = Account.objects.get(user=user)
    assert account.onboarding_completed is True
    assert account.address1 == ""
    assert account.university == "BRAC University"
    assert account.year_of_study == YearOfStudy.YEAR_2
