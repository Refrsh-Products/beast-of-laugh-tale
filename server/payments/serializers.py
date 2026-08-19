from rest_framework import serializers
from .models import Payment, PaymentAssistanceRequest, PaymentFallbackSettings
from accounts.models import BillingInterval
from django.conf import settings


class InitiatePaymentSerializer(serializers.Serializer):
    billing_interval = serializers.ChoiceField(choices=BillingInterval.choices)
    referral_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if settings.USE_MOCK_PAYMENT_GATEWAY:
            self.fields['mock_scenario'] = serializers.CharField(required=False, allow_blank=True)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'account', 'transaction_id', 'invoice_id', 'status', 'payment_method', 'metadata', 'created_at', 'updated_at']


class PaymentFallbackSettingsSerializer(serializers.ModelSerializer):
    """Read-only view of the outage toggle, consumed by the billing page."""

    whatsapp_url = serializers.CharField(read_only=True)

    class Meta:
        model = PaymentFallbackSettings
        fields = ['enabled', 'headline', 'message', 'whatsapp_url']
        read_only_fields = fields


class PaymentAssistanceRequestSerializer(serializers.ModelSerializer):
    whatsapp_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentAssistanceRequest
        fields = ['reference_code', 'billing_interval', 'referral_code', 'phone', 'status', 'whatsapp_url', 'created_at']
        read_only_fields = ['reference_code', 'status', 'whatsapp_url', 'created_at']
        extra_kwargs = {
            'referral_code': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
        }

    def get_whatsapp_url(self, obj) -> str:
        return PaymentFallbackSettings.load().whatsapp_url
