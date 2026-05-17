from datetime import date

from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import AccountSerializer
from rest_framework import generics
from .models import Account, DailyUsage
from .services import quota
from notebooks.models import Notebook

# Lists all accounts and creates new one
class AccountListAPIView(generics.ListCreateAPIView):
    """
    GET: Returns a list of all accounts.
    POST: Creates a new account in the database.
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, onboarding_completed=True)

# Show the current user's account (no ID needed)
class AccountDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View the current user's account details.
    PUT: Replace the current user's account record.
    PATCH: Update specific fields of the current user's account.
    DELETE: Remove the current user's account.
    """
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):  # type: ignore[override]
        try:
            return Account.objects.get(user=self.request.user)
        except Account.DoesNotExist:
            raise NotFound("No account found for this user.")


class AccountUsageAPIView(APIView):
    """
    GET: Returns current usage vs limits for the authenticated user's account.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
            raise NotFound("No account found for this user.")

        plan = quota.get_effective_plan(account)
        limits = quota.get_limits(plan)

        notebook_count = Notebook.objects.filter(user=request.user).count()
        max_notebooks = limits["max_notebooks"]

        usage_today, _ = DailyUsage.objects.get_or_create(account=account, date=date.today())
        max_quizzes = limits["max_quizzes_per_day"]
        max_presentations = limits["max_presentations_total"]

        storage_limit_bytes = limits["storage_mega_bytes"] * 1024 * 1024

        return Response({
            "plan": plan,
            "notebooks": {
                "used": notebook_count,
                "limit": max_notebooks,
            },
            "storage": {
                "used_bytes": account.storage_bytes_used,
                "limit_bytes": storage_limit_bytes,
            },
            "daily_quizzes": {
                "used": usage_today.quizzes_generated,
                "limit": max_quizzes,
            },
            "presentations": {
                "used": account.presentations_generated,
                "limit": max_presentations,
            },
        })
