from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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

# Show a specific account by ID
class AccountDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View details of one account.
    PUT: Replace an entire account record.
    PATCH: Update only specific fields of an account.
    DELETE: Remove the account from the database.
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)
