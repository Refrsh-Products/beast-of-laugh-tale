from django.shortcuts import get_object_or_404
from rest_framework.generics import RetrieveAPIView

from .models import Policy
from .serializers import PolicySerializer


class ActivePolicyView(RetrieveAPIView):
    serializer_class = PolicySerializer
    authentication_classes = []
    permission_classes = []

    def get_object(self):
        return get_object_or_404(
            Policy, slug=self.kwargs["slug"], is_active=True
        )
