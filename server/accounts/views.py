from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from .serializers import AccountSerializer
from rest_framework import generics
from .models import Account

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
