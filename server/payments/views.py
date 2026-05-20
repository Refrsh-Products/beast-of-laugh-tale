import json
import logging
import requests
from drf_spectacular.utils import extend_schema

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

logger = logging.getLogger(__name__)

ZINIPAY_CREATE_URL = 'https://api.zinipay.com/v1/payment/create'
ZINIPAY_VERIFY_URL = 'https://api.zinipay.com/v1/payment/verify'

@extend_schema(request=InitiatePaymentSerializer)
class InitiatePaymentView(APIView):
    """
    POST: Initiates a ZiniPay payment session.
    Returns a payment URL for the frontend to redirect the user to.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        billing_interval = serializer.validated_data['billing_interval'] # type: ignore

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
        amount = prices[billing_interval]

        payment = Payment.objects.create(
            account=account,
            amount=amount,
            billing_interval=billing_interval,
            status=PaymentStatus.PENDING,
        )
        logger.info(
            "Payment record created: payment_id=%s account_id=%s amount=%s billing_interval=%s",
            payment.id, account.id, amount, billing_interval,
        )

        payload = {
            'amount': str(amount),
            'redirect_url': f"{settings.FRONTEND_URL}/payment/success",
            'cancel_url': f"{settings.FRONTEND_URL}/payment/cancel",
            'webhook_url': f"{settings.BACKEND_URL}/api/payments/webhook/",
            'cus_email': request.user.email,
            'cus_name': f"{account.first_name} {account.last_name}",
            'val_id': str(payment.id),
            'metadata': {
                'payment_id': str(payment.id),
                'billing_interval': billing_interval,
            },
        }

        logger.debug("ZiniPay create payload: %s", payload)

        try:
            response = requests.post(
                ZINIPAY_CREATE_URL,
                json=payload,
                headers={
                    'zini-api-key': settings.ZINIPAY_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            logger.debug("ZiniPay create response: status=%s data=%s", response.status_code, data)
        except requests.RequestException as e:
            logger.exception(
                "ZiniPay create-invoice failed: payment_id=%s error=%s", payment.id, e,
            )
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Payment gateway error. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        payment_url = data.get('payment_url')
        if not payment_url:
            logger.error(
                "ZiniPay create-invoice returned no payment_url: payment_id=%s response=%s",
                payment.id, data,
            )
        else:
            logger.info(
                "ZiniPay invoice created: payment_id=%s status_code=%s",
                payment.id, response.status_code,
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
    POST: Receives payment notifications from ZiniPay.

    The webhook only carries {invoice_id, status, val_id} (as JSON body or
    query parameters). We use val_id to find our Payment, then call the
    /v1/payment/verify endpoint to fetch the authoritative payment details
    before updating the record.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
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
            verify_response = requests.post(
                ZINIPAY_VERIFY_URL,
                json={'invoice_id': invoice_id},
                headers={
                    'zini-api-key': settings.ZINIPAY_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout=10,
            )
            verify_response.raise_for_status()
            verified = verify_response.json()
            logger.debug(
                "ZiniPay verify response: payment_id=%s status_code=%s data=%s",
                payment.id, verify_response.status_code, verified,
            )
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
