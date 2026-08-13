"""
Tests for InitiatePaymentView input validation and happy path.
"""

from decimal import Decimal

from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from payments.models import Payment, BillingInterval, PaymentStatus
from accounts.models import Account, TierPlan
from django.conf import settings
from campus_champions.models import ReferralUsage, CampusChampion
from tests.factories import AccountFactory, CampusChampionFactory

INITIATE_PAYMENT_URL = reverse("payments:payment-initiate")

def test_invalid_billing_interval(authenticated_client):
    """
    Given: An authenticated client 
    When: Client tries to make a payment with invalid billing interval
    Then: The payment fails and no Payment Record is created
    """
    response = authenticated_client.post(
        INITIATE_PAYMENT_URL,
        {
            "billing_interval": "not_a_real_value",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Payment.objects.count() == 0

def test_payment_without_billing_interval(authenticated_client):
    """
    Given: An authenticated client
    When: Client tries to make a payment without billing interval
    Then: They payment fails and no Payment Record is created
    """
    response = authenticated_client.post(
        INITIATE_PAYMENT_URL,
        {},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert Payment.objects.count() == 0

@override_settings(USE_MOCK_PAYMENT_GATEWAY=False)
def test_payment_successful(mock_gateway, authenticated_client, user):
    """
    Given: An authenticated client with default account
    When: Client makes a payment with proper billing interval and no referral code
    Then: The payment succeeds, Payment Record is created
    """
    AccountFactory(user=user)

    response = authenticated_client.post(
        INITIATE_PAYMENT_URL,
        {
            "billing_interval": BillingInterval.MONTHLY,
            "referral_code": "",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["payment_url"]
    assert Payment.objects.count() == 1

    payment = Payment.objects.get()
    assert payment.status == PaymentStatus.PENDING
    assert payment.billing_interval == BillingInterval.MONTHLY
    assert payment.account.user == user
    assert payment.amount == Decimal(settings.ZINIPAY_MONTHLY_PRICE)
    # The gateway's invoice_id is bound to the payment at creation, so the
    # webhook can later reject any mismatched invoice.
    assert payment.invoice_id == "inv_test_123"
    
    account = Account.objects.get(user=user)
    assert account.tier_plan == TierPlan.FREE

@override_settings(USE_MOCK_PAYMENT_GATEWAY=False)
def test_referral_discount(mock_gateway, authenticated_client, user):
    """
    Given: An authenticated client with default account and an active Campus Champion
    When: the client makes a payment with active referral code
    Then: the client gets a discounted price
    """
    AccountFactory(user=user)
    champion = CampusChampionFactory(discount_percentage=20, active=True)

    response = authenticated_client.post(
        INITIATE_PAYMENT_URL,
        {
            "billing_interval": BillingInterval.MONTHLY,
            "referral_code": champion.referral_code,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["payment_url"]
    assert Payment.objects.count() == 1

    payment = Payment.objects.get()
    assert payment.status == PaymentStatus.PENDING
    assert payment.billing_interval == BillingInterval.MONTHLY
    assert payment.account.user == user
    assert payment.amount == Decimal("280")

    account = Account.objects.get(user=user)
    assert account.tier_plan == TierPlan.FREE

    assert ReferralUsage.objects.count() == 0