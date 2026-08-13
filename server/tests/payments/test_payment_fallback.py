"""
Tests for PaymentFallbackStatusView — the gateway-outage toggle read by the
billing page.
"""

from django.urls import reverse
from rest_framework import status

from payments.models import PaymentFallbackSettings

FALLBACK_URL = reverse("payments:payment-fallback-status")


def test_fallback_status_is_public(api_client, db):
    """
    Given: An unauthenticated client
    When: It reads the fallback status
    Then: The endpoint responds, since the billing and landing pages both need it
    """
    response = api_client.get(FALLBACK_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["enabled"] is False


def test_fallback_status_defaults_are_created_on_first_read(api_client, db):
    """
    Given: No settings row exists yet
    When: A client reads the fallback status
    Then: The singleton is created with the fallback disabled
    """
    assert PaymentFallbackSettings.objects.count() == 0

    response = api_client.get(FALLBACK_URL)

    assert response.status_code == status.HTTP_200_OK
    assert PaymentFallbackSettings.objects.count() == 1
    assert response.data["enabled"] is False
    assert response.data["headline"]
    assert response.data["message"]


def test_fallback_status_reflects_enabled_toggle(api_client, db):
    """
    Given: Ops has enabled the fallback and set the copy
    When: A client reads the fallback status
    Then: The toggle, copy, and WhatsApp link all come back
    """
    settings_row = PaymentFallbackSettings.load()
    settings_row.enabled = True
    settings_row.headline = "Payments are down"
    settings_row.message = "Talk to our team instead."
    settings_row.whatsapp_number = "8801712345678"
    settings_row.save()

    response = api_client.get(FALLBACK_URL)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["enabled"] is True
    assert response.data["headline"] == "Payments are down"
    assert response.data["message"] == "Talk to our team instead."
    assert response.data["whatsapp_url"] == "https://wa.me/8801712345678"


def test_whatsapp_url_is_blank_when_no_number_is_set(api_client, db):
    """
    Given: Sales has not configured a WhatsApp number
    When: A client reads the fallback status
    Then: The URL is blank rather than a broken wa.me link
    """
    response = api_client.get(FALLBACK_URL)

    assert response.data["whatsapp_url"] == ""


def test_whatsapp_number_is_normalised_to_digits(db):
    """
    Given: A number entered with spaces and punctuation
    When: The WhatsApp URL is built
    Then: Only the digits survive, since wa.me rejects anything else
    """
    settings_row = PaymentFallbackSettings.load()
    settings_row.whatsapp_number = "+880 171-234 5678"
    settings_row.save()

    assert settings_row.whatsapp_url == "https://wa.me/8801712345678"


def test_settings_row_is_a_singleton(db):
    """
    Given: An existing settings row
    When: Another instance is saved
    Then: It overwrites the same row instead of creating a second one
    """
    PaymentFallbackSettings.load()
    PaymentFallbackSettings(enabled=True).save()

    assert PaymentFallbackSettings.objects.count() == 1
    assert PaymentFallbackSettings.load().enabled is True
