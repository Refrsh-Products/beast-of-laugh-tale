from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CampusChampion, ReferralUsage
from .serializers import ValidateReferralCodeSerializer


class ValidateReferralCodeView(APIView):
    """
    POST: Validates a referral code and returns its discount details.

    Returns:
      - valid=true  + discount_percentage + champion_name  → code is active
      - valid=false + reason="invalid"                     → code missing / inactive
      - valid=false + reason="already_used"                → user already used this champion's code
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ValidateReferralCodeSerializer)
    def post(self, request):
        serializer = ValidateReferralCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        referral_code = serializer.validated_data['referral_code'] # type: ignore

        champion = CampusChampion.objects.filter(
            referral_code=referral_code, active=True
        ).first()

        if not champion:
            return Response(
                {'valid': False, 'reason': 'invalid'},
                status=status.HTTP_200_OK,
            )

        already_used = ReferralUsage.objects.filter(
            champion=champion, user=request.user,
        ).exists()

        if already_used:
            return Response(
                {'valid': False, 'reason': 'already_used'},
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'valid': True,
                'discount_percentage': champion.discount_percentage,
                'champion_name': champion.name,
            },
            status=status.HTTP_200_OK,
        )
