from rest_framework import serializers
from .models import Account

class AccountSerializer(serializers.ModelSerializer):
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
            'created_at',
            'updated_at',
        ]