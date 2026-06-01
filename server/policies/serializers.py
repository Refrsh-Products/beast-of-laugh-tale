from rest_framework import serializers

from .models import Policy


class PolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = Policy
        fields = ["slug", "version", "title", "body", "effective_date", "updated_at"]
        read_only_fields = fields
