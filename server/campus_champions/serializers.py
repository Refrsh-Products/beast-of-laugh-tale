from rest_framework import serializers


class ValidateReferralCodeSerializer(serializers.Serializer):
    referral_code = serializers.CharField(max_length=50)
