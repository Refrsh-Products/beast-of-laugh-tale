from rest_framework import serializers
from .models import Payment
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
