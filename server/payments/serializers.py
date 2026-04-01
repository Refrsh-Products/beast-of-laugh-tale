from rest_framework import serializers
from .models import Payment
from accounts.models import BillingInterval


class InitiatePaymentSerializer(serializers.Serializer):
    billing_interval = serializers.ChoiceField(choices=BillingInterval.choices)


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'account', 'transaction_id', 'invoice_id', 'status', 'payment_method', 'metadata', 'created_at', 'updated_at']
