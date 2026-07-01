import json
import logging
import requests
from decimal import Decimal
from drf_spectacular.utils import extend_schema, OpenApiExample

from django.conf import settings
from django.core import exceptions as django_exceptions
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Account
from accounts.services.upgrade import upgrade_account_to_pro
from .models import Payment, PaymentStatus, BillingInterval
from .serializers import InitiatePaymentSerializer, PaymentSerializer
from campus_champions.services import log_referral_usage
from campus_champions.models import CampusChampion
from .gateways import get_payment_gateway


logger = logging.getLogger(__name__)

@extend_schema(
        request=InitiatePaymentSerializer,
        examples=[
            OpenApiExample(
                'Mock scenario (dev only)',
                value={'billing_interval': 'monthly', 'referral_code': '', 'mock_scenario': 'MOCK_PAYMENT_FAILED'},
                request_only=True,
            ),
        ] if settings.USE_MOCK_PAYMENT_GATEWAY else [],
    )
class InitiatePaymentView(APIView):
    """
    POST: Initiates a ZiniPay payment session.
    Returns a payment URL for the frontend to redirect the user to.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        gateway = get_payment_gateway()
        
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        billing_interval = serializer.validated_data['billing_interval'] # type: ignore
        referral_code = serializer.validated_data.get('referral_code', '') # type: ignore

        logger.info(
            "InitiatePayment requested: user_id=%s billing_interval=%s",
            request.user.id, billing_interval,
        )

        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
            logger.warning("InitiatePayment: Account not found for user_id=%s", request.user.id)
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        prices: dict[str, object] = {
            BillingInterval.MONTHLY: settings.ZINIPAY_MONTHLY_PRICE,
            BillingInterval.YEARLY: settings.ZINIPAY_YEARLY_PRICE,
        }
        amount = Decimal(str(prices[billing_interval]))

        # Apply referral discount if the code matches an active champion
        if referral_code:
            champion = CampusChampion.objects.filter(
                referral_code=referral_code, active=True
            ).first()
            if champion and champion.discount_percentage > 0:
                discount = amount * Decimal(champion.discount_percentage) / Decimal(100)
                amount = (amount - discount).quantize(Decimal('1'))
                logger.info(
                    "Referral discount applied: code=%s discount_pct=%s original=%s final=%s",
                    referral_code, champion.discount_percentage,
                    prices[billing_interval], amount,
                )

        payment = Payment.objects.create(
            account=account,
            amount=amount,
            billing_interval=billing_interval,
            status=PaymentStatus.PENDING,
            referral_code=referral_code,
        )
        logger.info(
            "Payment record created: payment_id=%s account_id=%s amount=%s billing_interval=%s",
            payment.id, account.id, amount, billing_interval,
        )

        mock_scenario = ''
        if settings.USE_MOCK_PAYMENT_GATEWAY:
            mock_scenario = serializer.validated_data.get('mock_scenario', '') # type: ignore

        payload = {
            'amount': str(amount),
            'redirect_url': f"{settings.FRONTEND_URL}/payment/success",
            'cancel_url': f"{settings.FRONTEND_URL}/payment/cancel",
            'webhook_url': f"{settings.BACKEND_URL}/api/v{settings.API_VERSION}/payments/webhook/",
            'cus_email': request.user.email,
            'cus_name': f"{account.first_name} {account.last_name}",
            'val_id': str(payment.id),
            'metadata': {
                'payment_id': str(payment.id),
                'billing_interval': billing_interval,
                **(({'mock_scenario': mock_scenario} if mock_scenario else {})),
            },
        }

        logger.debug("ZiniPay create payload: %s", payload)

        try:
            data = gateway.create_invoice(payload)
            logger.debug("ZiniPay create response: data=%s", data)
        except requests.RequestException as e:
            logger.exception(
                "ZiniPay create-invoice failed: payment_id=%s error=%s", payment.id, e,
            )
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Payment gateway error. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        payment_url = data.get('payment_url')
        invoice_id = data.get('invoice_id', '')

        if settings.USE_MOCK_PAYMENT_GATEWAY and invoice_id:
            from .mock_utils import simulate_webhook_callback
            simulate_webhook_callback(invoice_id=invoice_id, val_id=str(payment.id))

        if not payment_url:
            logger.error(
                "ZiniPay create-invoice returned no payment_url: payment_id=%s response=%s",
                payment.id, data,
            )
        else:
            logger.info(
                "ZiniPay invoice created: payment_id=%s data=%s",
                payment.id, data,
            )

        return Response({'payment_url': payment_url}, status=status.HTTP_201_CREATED)


class PaymentListView(APIView):
    """GET: Returns all payments for the current user's account."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        payments = Payment.objects.filter(account=account)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class ZiniPayWebhookView(APIView):
    """
    GET/POST: Receives payment notifications from ZiniPay.

    ZiniPay sends the webhook as a GET with query params (same shape as the
    success redirect). POST with JSON body is also accepted. We use val_id
    to find our Payment, then call /v1/payment/verify to fetch authoritative
    payment details before updating the record — never trust the webhook
    payload directly since the URL is reachable from the public internet.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return self.post(request)

    def post(self, request):
        gateway = get_payment_gateway()
        
        try:
            body = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            body = {}

        invoice_id = body.get('invoice_id') or request.query_params.get('invoice_id')
        val_id = body.get('val_id') or request.query_params.get('val_id')

        logger.info(
            "ZiniPay webhook received: invoice_id=%s val_id=%s body_status=%s",
            invoice_id, val_id, body.get('status'),
        )

        if not invoice_id or not val_id:
            logger.warning(
                "ZiniPay webhook missing invoice_id/val_id: invoice_id=%s val_id=%s",
                invoice_id, val_id,
            )
            return Response({'detail': 'Missing invoice_id or val_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('account').get(id=val_id)
        except (Payment.DoesNotExist, ValueError, django_exceptions.ValidationError):
            logger.warning("ZiniPay webhook: Payment %s not found.", val_id)
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            verified = gateway.verify_invoice(invoice_id)
            logger.debug("ZiniPay verify response: payment_id=%s data=%s", payment.id, verified)
        except requests.RequestException as e:
            logger.exception(
                "ZiniPay verify request failed: payment_id=%s invoice_id=%s error=%s",
                payment.id, invoice_id, e,
            )
            return Response({'detail': 'Verification failed.'}, status=status.HTTP_502_BAD_GATEWAY)

        verified_status = verified.get('status', '')
        logger.info(
            "ZiniPay verify succeeded: payment_id=%s invoice_id=%s verified_status=%s transaction_id=%s",
            payment.id, invoice_id, verified_status, verified.get('transaction_id'),
        )

        payment.transaction_id = verified.get('transaction_id', '')
        payment.invoice_id = verified.get('invoice_id', invoice_id)
        payment.payment_method = verified.get('payment_method', '')
        payment.metadata = verified

        if verified_status == 'COMPLETED':
            payment.status = PaymentStatus.COMPLETED
            upgrade_account_to_pro(payment.account, payment.billing_interval)

            # Log referral usage — safe to call on every payment (renewal or not),
            # the UniqueConstraint(champion, user) ensures only the first counts.
            if payment.referral_code:
                log_referral_usage(
                    user=payment.account.user, 
                    gateway_transaction_id=verified.get('transaction_id', invoice_id),
                    referral_code=payment.referral_code,
                )

                logger.info(
                    "Referral code used in payment: payment_id=%s account_id=%s referral_code=%s",
                    payment.id, payment.account.id, payment.referral_code,
                )

            logger.info(
                "Payment COMPLETED and account upgraded: payment_id=%s account_id=%s billing_interval=%s",
                payment.id, payment.account.id, payment.billing_interval,
            )
        elif verified_status == 'FAILED':
            payment.status = PaymentStatus.FAILED
            logger.warning(
                "Payment FAILED: payment_id=%s invoice_id=%s", payment.id, invoice_id,
            )
        elif verified_status == 'PENDING':
            payment.status = PaymentStatus.PENDING
            logger.info(
                "Payment still PENDING after verify: payment_id=%s invoice_id=%s",
                payment.id, invoice_id,
            )
        else:
            logger.warning(
                "Payment verify returned unknown status: payment_id=%s verified_status=%s",
                payment.id, verified_status,
            )

        payment.save(update_fields=['transaction_id', 'invoice_id', 'payment_method', 'metadata', 'status', 'updated_at'])

        return Response({'detail': 'OK'}, status=status.HTTP_200_OK)
