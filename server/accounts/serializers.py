from rest_framework import serializers
from .models import Account


class WhatsAppCommunitySerializer(serializers.Serializer):
    """
    Response shape for /accounts/me/community/. A plain Serializer, not a
    ModelSerializer: the payload spans the settings singleton and one Account
    column, so there is no single model to bind to. Read-only throughout — the
    only write is the POST, which takes no body.
    """

    # Already folded together with invite_url server-side, so `enabled` here
    # means "on AND openable" — see services/community.build_community_payload.
    enabled = serializers.BooleanField(read_only=True)
    invite_url = serializers.CharField(read_only=True, allow_blank=True)
    headline = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    opted_in_at = serializers.DateTimeField(read_only=True, allow_null=True)

class AccountSerializer(serializers.ModelSerializer):
    """
    `fields = '__all__'` means every editable model field is writable through
    PATCH /accounts/me/ and POST /accounts/ unless it is listed below. Anything
    the server owns MUST be added here — otherwise a client can simply set it.
    `onboarding_completed` stays writable on purpose: onboarding sets it.
    """

    class Meta():
        model = Account
        fields = '__all__'
        read_only_fields = [
            'id',
            'user',
            'tier_plan',
            'billing_interval',
            'subscription_status',
            'subscription_start_date',
            'subscription_end_date',
            # Consent record. Only POST /accounts/me/community/ may set it, or a
            # client could forge the timestamp — and the web profile screen
            # PATCHes a whole spread account object on every inline edit, which
            # would otherwise resend a stale value.
            'whatsapp_community_opt_in_at',
            # Quota counters the server owns. These were writable, which let any
            # authenticated user reset their own limits: quota.check_storage_quota
            # reads storage_bytes_used and check_presentation_quota reads
            # presentations_generated.
            'storage_bytes_used',
            'presentations_generated',
            'created_at',
            'updated_at',
        ]