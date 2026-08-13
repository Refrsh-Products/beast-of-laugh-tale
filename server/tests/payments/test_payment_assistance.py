"""
Tests for PaymentAssistanceRequestView — the contact-sales queue users land in
while the payment gateway is down.
"""

from django.urls import reverse
from rest_framework import status

from payments.models import (
    AssistanceRequestStatus,
    PaymentAssistanceRequest,
    PaymentFallbackSettings,
)
from accounts.models import BillingInterval
from tests.factories import AccountFactory

ASSISTANCE_URL = reverse("payments:payment-assistance")


def test_assistance_request_requires_authentication(api_client, db):
    """
    Given: An unauthenticated client
    When: It submits an assistance request
    Then: The request is rejected and nothing is queued for sales
    """
    response = api_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )

    assert response.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )
    assert PaymentAssistanceRequest.objects.count() == 0


def test_invalid_billing_interval_is_rejected(authenticated_client, user):
    """
    Given: An authenticated user
    When: They submit an unknown billing interval
    Then: The request is rejected and nothing is queued
    """
    AccountFactory(user=user)

    response = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": "not_a_real_value"}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert PaymentAssistanceRequest.objects.count() == 0


def test_assistance_request_is_created_with_reference_code(authenticated_client, user):
    """
    Given: An authenticated user whose checkout is unavailable
    When: They request paid access
    Then: A NEW request is queued with a reference code they can quote to sales
    """
    account = AccountFactory(user=user)

    response = authenticated_client.post(
        ASSISTANCE_URL,
        {"billing_interval": BillingInterval.YEARLY, "phone": "01799999999"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED

    assistance_request = PaymentAssistanceRequest.objects.get()
    assert assistance_request.account == account
    assert assistance_request.status == AssistanceRequestStatus.NEW
    assert assistance_request.billing_interval == BillingInterval.YEARLY
    assert assistance_request.phone == "01799999999"
    assert assistance_request.reference_code.startswith("FR-")
    assert response.data["reference_code"] == assistance_request.reference_code


def test_request_succeeds_while_fallback_is_disabled(authenticated_client, user):
    """
    Given: The fallback toggle is still off
    When: A user submits a request anyway (the frontend's 502 backstop path)
    Then: It is accepted, because that is exactly the case the backstop covers
    """
    AccountFactory(user=user)
    assert PaymentFallbackSettings.load().enabled is False

    response = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert PaymentAssistanceRequest.objects.count() == 1


def test_phone_falls_back_to_the_account_number(authenticated_client, user):
    """
    Given: A user who leaves the optional phone field blank
    When: They request paid access
    Then: Sales still gets a number to call, taken from the account
    """
    account = AccountFactory(user=user, phone="01711111111")

    authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )

    assert PaymentAssistanceRequest.objects.get().phone == account.phone


def test_referral_code_is_carried_through(authenticated_client, user):
    """
    Given: A user who had a referral discount applied at checkout
    When: They request paid access instead
    Then: The code reaches sales, so the discount they were shown is honoured
    """
    AccountFactory(user=user)

    authenticated_client.post(
        ASSISTANCE_URL,
        {
            "billing_interval": BillingInterval.MONTHLY,
            "referral_code": "ABC-FRE-123",
        },
        format="json",
    )

    assert PaymentAssistanceRequest.objects.get().referral_code == "ABC-FRE-123"


def test_second_submit_reuses_the_open_request(authenticated_client, user):
    """
    Given: A user who already has an open request
    When: They submit again with a different plan
    Then: The existing row is updated rather than duplicated in the sales queue
    """
    AccountFactory(user=user)

    first = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )
    second = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.YEARLY}, format="json"
    )

    assert first.status_code == status.HTTP_201_CREATED
    assert second.status_code == status.HTTP_200_OK
    assert second.data["reference_code"] == first.data["reference_code"]

    assistance_request = PaymentAssistanceRequest.objects.get()
    assert assistance_request.billing_interval == BillingInterval.YEARLY


def test_closed_request_does_not_block_a_new_one(authenticated_client, user):
    """
    Given: A user whose earlier request was already converted
    When: They ask for help again
    Then: A fresh request is queued instead of reopening a finished one
    """
    AccountFactory(user=user)

    authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )
    PaymentAssistanceRequest.objects.update(status=AssistanceRequestStatus.CONVERTED)

    response = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert PaymentAssistanceRequest.objects.count() == 2


def test_missing_account_returns_404(authenticated_client, user):
    """
    Given: A user with no Account row
    When: They request paid access
    Then: The endpoint reports the missing account rather than erroring
    """
    response = authenticated_client.post(
        ASSISTANCE_URL, {"billing_interval": BillingInterval.MONTHLY}, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert PaymentAssistanceRequest.objects.count() == 0
