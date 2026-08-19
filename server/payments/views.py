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
from .models import (
    AssistanceRequestStatus,
    Payment,
    PaymentAssistanceRequest,
    PaymentFallbackSettings,
    PaymentStatus,
    BillingInterval,
)
from .serializers import (
    InitiatePaymentSerializer,
    PaymentAssistanceRequestSerializer,
    PaymentFallbackSettingsSerializer,
    PaymentSerializer,
)
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
    POST: Initiates a payment session.
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
            BillingInterval.SEMESTER: settings.ZINIPAY_SEMESTER_PRICE,
            # Legacy interval, kept so a stale client can't 500 the endpoint.
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

        if invoice_id:
            payment.invoice_id = invoice_id
            payment.save(update_fields=['invoice_id', 'updated_at'])

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


class PaymentFallbackStatusView(APIView):
    """
    GET: Returns the gateway-outage fallback state and its copy.

    Unauthenticated on purpose — it carries no user data, and the landing page's
    pricing section should be able to read it too.
    """
    authentication_classes = []
    permission_classes = []

    @extend_schema(responses=PaymentFallbackSettingsSerializer)
    def get(self, request):
        serializer = PaymentFallbackSettingsSerializer(PaymentFallbackSettings.load())
        return Response(serializer.data)


class PaymentAssistanceRequestView(APIView):
    """
    POST: Records a request to be upgraded manually while checkout is down.

    Deliberately not gated on the fallback toggle: the frontend also falls back
    to this form when `initiate` returns a 502, which is the case where the
    gateway has dropped before anyone has flipped the switch.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=PaymentAssistanceRequestSerializer,
        responses=PaymentAssistanceRequestSerializer,
    )
    def post(self, request):
        serializer = PaymentAssistanceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
            logger.warning("PaymentAssistance: Account not found for user_id=%s", request.user.id)
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        billing_interval = serializer.validated_data['billing_interval']  # type: ignore
        referral_code = serializer.validated_data.get('referral_code', '')  # type: ignore
        phone = serializer.validated_data.get('phone', '') or account.phone # type: ignore

        # One open request per account — an impatient user tapping submit twice
        # should reach the same salesperson, not add a second row to the queue.
        existing = PaymentAssistanceRequest.objects.filter(
            account=account,
            status__in=PaymentAssistanceRequest.OPEN_STATUSES,
        ).first()

        if existing:
            # Their plan choice may have changed since the first submit.
            existing.billing_interval = billing_interval
            existing.referral_code = referral_code
            existing.phone = phone
            existing.save(update_fields=['billing_interval', 'referral_code', 'phone', 'updated_at'])
            logger.info(
                "PaymentAssistance: reusing open request ref=%s account_id=%s",
                existing.reference_code, account.id,
            )
            return Response(
                PaymentAssistanceRequestSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        assistance_request = PaymentAssistanceRequest.objects.create(
            account=account,
            billing_interval=billing_interval,
            referral_code=referral_code,
            phone=phone,
            status=AssistanceRequestStatus.NEW,
        )
        logger.info(
            "PaymentAssistance: request created ref=%s account_id=%s billing_interval=%s",
            assistance_request.reference_code, account.id, billing_interval,
        )

        return Response(
            PaymentAssistanceRequestSerializer(assistance_request).data,
            status=status.HTTP_201_CREATED,
        )


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

        # Bind the webhook to the invoice we recorded at creation. An attacker
        # cannot pair a foreign (cheap) completed invoice with a different val_id.
        if invoice_id != payment.invoice_id:
            logger.warning(
                "ZiniPay webhook invoice mismatch: payment_id=%s stored=%s got=%s",
                payment.id, payment.invoice_id, invoice_id,
            )
            return Response({'detail': 'Invoice mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

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
            # Defense-in-depth: even a COMPLETED invoice must have paid AT LEAST the
            # amount owed. Underpayment is the attack; overpayment is fine (never deny
            # service to someone who paid more than the plan costs).
            verified_amount = Decimal(str(verified.get('amount', '0')))
            if verified_amount < payment.amount:
                payment.status = PaymentStatus.FAILED
                logger.error(
                    "ZiniPay webhook underpayment: payment_id=%s owed=%s verified=%s — not upgrading.",
                    payment.id, payment.amount, verified_amount,
                )
                payment.save(update_fields=[
                    'transaction_id', 'invoice_id', 'payment_method', 'metadata', 'status', 'updated_at',
                ])
                return Response({'detail': 'Amount mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

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
