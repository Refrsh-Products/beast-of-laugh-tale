from datetime import date

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import AccountSerializer, WhatsAppCommunitySerializer
from rest_framework import generics
from .models import Account, DailyUsage, WhatsAppCommunitySettings
from .services import quota
from .services.account import ensure_account
from .services.community import build_community_payload, clear_opt_in, record_opt_in
from notebooks.models import Notebook

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
    GET: Returns current usage vs limits and features available for the authenticated user's account.
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

        transcription_feature = limits["audio_feature_enabled"]

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
            "features": {
                "audio_notes": transcription_feature,
            },
        })


class WhatsAppCommunityView(APIView):
    """
    GET: the community invite settings plus whether this user has opted in.
    POST: record that the user tapped "Join" (idempotent), and return the same body.
    DELETE: withdraw the consent record. Does NOT remove them from the group —
            only the user can do that, inside WhatsApp. (THERE IS NO UI FOR IT YET)
    """
    permission_classes = (IsAuthenticated,)

    def _payload(self, account, opted_in_at):
        settings_row = WhatsAppCommunitySettings.load()
        data = build_community_payload(settings_row, opted_in_at)
        return Response(WhatsAppCommunitySerializer(data).data)

    @extend_schema(responses=WhatsAppCommunitySerializer)
    def get(self, request):
        # Deliberately not ensure_account(): a read must never create a user row.
        account = (
            Account.objects
            .filter(user=request.user)
            .only('id', 'whatsapp_community_opt_in_at')
            .first()
        )
        return self._payload(account, account.whatsapp_community_opt_in_at if account else None)

    @extend_schema(request=None, responses=WhatsAppCommunitySerializer)
    def post(self, request):
        # get-or-create rather than 404, so the endpoint is total. This never
        # un-completes an existing row.
        account = ensure_account(request.user)
        opted_in_at = record_opt_in(account)
        # Succeeds even when the community is disabled. If ops flip the toggle
        # off between the client's GET and this POST, erroring would surface a
        # failure on the one screen that must never show one — so we record the
        # consent and return an empty invite_url.
        return self._payload(account, opted_in_at)

    @extend_schema(request=None, responses=WhatsAppCommunitySerializer)
    def delete(self, request):
        account = Account.objects.filter(user=request.user).first()
        if account:
            clear_opt_in(account)
        return self._payload(account, None)
