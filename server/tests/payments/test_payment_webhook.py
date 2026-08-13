import pytest

from django.urls import reverse
from rest_framework import status
from decimal import Decimal

from tests.factories import PaymentFactory
from accounts.models import Account, TierPlan, SubscriptionStatus
from payments.models import PaymentStatus

PAYMENT_WEBHOOK_URL = reverse("payments:payment-webhook")

@pytest.mark.django_db
def test_successful_webhook(api_client, mock_gateway):
    """
    Arrange: a PENDING PaymentFactory(); mock verify_invoice → COMPLETED.
    Act: POST the webhook with val_id = payment.id.
    Assert: 200; payment.refresh_from_db() → status == COMPLETED; 
        the account (refreshed) → tier_plan == PAID and subscription_status == ACTIVE; transaction_id/payment_method got saved from the verify response.
    """
    payment = PaymentFactory(invoice_id="inv_test_123")
    mock_gateway.verify_invoice.return_value = {
        "status": PaymentStatus.COMPLETED,
        "transaction_id": "txn_test_123",
        "invoice_id": "inv_test_123",
        "payment_method": "bkash",
        "amount": str(payment.amount),
    }

    response = api_client.post(
        PAYMENT_WEBHOOK_URL,
        {
            "invoice_id": payment.invoice_id,
            "val_id": str(payment.id)
        },
        format="json"
    )

    assert response.status_code == status.HTTP_200_OK

    payment.refresh_from_db()
    assert payment.status == PaymentStatus.COMPLETED
    assert payment.transaction_id == "txn_test_123"
    assert payment.payment_method == "bkash"

    account = Account.objects.get()
    assert account.tier_plan == TierPlan.PAID
    assert account.subscription_status == SubscriptionStatus.ACTIVE
    
@pytest.mark.django_db
def test_webhook_ignores_payload_status(mock_gateway, api_client):
    """
    Arrange: PENDING PaymentFactory(invoice_id="inv_test_123"); mock verify_invoice → FAILED.
    Act: POST the webhook with a body that lies — 
        include "status": "COMPLETED" alongside invoice_id/val_id.
    Assert: the payment ends up FAILED, not COMPLETED; 
        and the account stays FREE / INACTIVE (no upgrade).
    """
    mock_gateway.verify_invoice.return_value = {
        "status": PaymentStatus.FAILED,
        "transaction_id": "txn_test_123",
        "invoice_id": "inv_test_123",
        "payment_method": "bkash",
    }
    payment = PaymentFactory(invoice_id="inv_test_123")

    response = api_client.post(
        PAYMENT_WEBHOOK_URL,
        {
            "invoice_id": payment.invoice_id,
            "val_id": str(payment.id),
            "status": PaymentStatus.COMPLETED,
        },
        format="json"
    )

    assert response.status_code == status.HTTP_200_OK

    payment.refresh_from_db()
    assert payment.status == PaymentStatus.FAILED

    account = Account.objects.get()
    assert account.tier_plan == TierPlan.FREE
    assert account.subscription_status == SubscriptionStatus.INACTIVE

@pytest.mark.django_db
def test_webhook_rejects_substituted_invoice(mock_gateway, api_client):
    """
    Arrange: a PENDING PaymentFactory bound to invoice "inv_real_1200" at creation.
    Act: POST the webhook pairing this payment's val_id with a DIFFERENT (attacker's)
         invoice_id and a lying "status": "COMPLETED".
    Assert: 400 Invoice mismatch; payment not COMPLETED; account stays FREE/INACTIVE;
            and verify_invoice is never called (we reject before spending a verify).
    """
    mock_gateway.verify_invoice.return_value = {
        "status": PaymentStatus.COMPLETED,
        "transaction_id": "txn_test_123",
        "invoice_id": "inv_attacker_350",
        "payment_method": "bkash",
        "amount": "350",
    }
    payment = PaymentFactory(invoice_id="inv_real_1200", amount=Decimal("1200"))

    response = api_client.post(
        PAYMENT_WEBHOOK_URL,
        {
            "invoice_id": "inv_attacker_350",
            "val_id": str(payment.id),
            "status": PaymentStatus.COMPLETED,
        },
        format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST

    payment.refresh_from_db()
    assert payment.status != PaymentStatus.COMPLETED

    account = Account.objects.get()
    assert account.tier_plan == TierPlan.FREE
    assert account.subscription_status == SubscriptionStatus.INACTIVE

    mock_gateway.verify_invoice.assert_not_called()

@pytest.mark.django_db
def test_webhook_rejects_underpayment(mock_gateway, api_client):
    """
    Arrange: a PENDING PaymentFactory owing 1200, bound to invoice "inv_test_123".
    Act: POST the webhook with the CORRECT invoice, but verify reports COMPLETED
         for LESS than owed (350).
    Assert: 400; payment not COMPLETED; account stays FREE/INACTIVE.
    """
    payment = PaymentFactory(invoice_id="inv_test_123", amount=Decimal("1200"))
    mock_gateway.verify_invoice.return_value = {
        "status": PaymentStatus.COMPLETED,
        "transaction_id": "txn_test_123",
        "invoice_id": "inv_test_123",
        "payment_method": "bkash",
        "amount": "350",
    }

    response = api_client.post(
        PAYMENT_WEBHOOK_URL,
        {
            "invoice_id": payment.invoice_id,
            "val_id": str(payment.id),
            "status": PaymentStatus.COMPLETED,
        },
        format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST

    payment.refresh_from_db()
    assert payment.status != PaymentStatus.COMPLETED

    account = Account.objects.get()
    assert account.tier_plan == TierPlan.FREE
    assert account.subscription_status == SubscriptionStatus.INACTIVE

@pytest.mark.django_db
def test_webhook_accepts_overpayment(mock_gateway, api_client):
    """
    A user who pays MORE than owed (360 for a 350 plan) must still be upgraded —
    overpayment is not an attack, and we never deny service to someone who paid enough.
    """
    payment = PaymentFactory(invoice_id="inv_test_123", amount=Decimal("350"))
    mock_gateway.verify_invoice.return_value = {
        "status": PaymentStatus.COMPLETED,
        "transaction_id": "txn_test_123",
        "invoice_id": "inv_test_123",
        "payment_method": "bkash",
        "amount": "360",
    }

    response = api_client.post(
        PAYMENT_WEBHOOK_URL,
        {
            "invoice_id": payment.invoice_id,
            "val_id": str(payment.id),
            "status": PaymentStatus.COMPLETED,
        },
        format="json"
    )

    assert response.status_code == status.HTTP_200_OK

    payment.refresh_from_db()
    assert payment.status == PaymentStatus.COMPLETED

    account = Account.objects.get()
    assert account.tier_plan == TierPlan.PAID
    assert account.subscription_status == SubscriptionStatus.ACTIVE