from rest_framework import serializers

class QueryInputSerializer(serializers.Serializer):
    notebook_id = serializers.UUIDField()
    user_query = serializers.CharField()