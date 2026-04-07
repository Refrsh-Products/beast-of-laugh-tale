import json
import logging
import requests
import stripe
from datetime import timedelta
from drf_spectacular.utils import extend_schema

from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Account, TierPlan, SubscriptionStatus
from .models import Payment, PaymentStatus, BillingInterval
from .serializers import InitiatePaymentSerializer, PaymentSerializer

logger = logging.getLogger(__name__)

ZINIPAY_API_URL = 'https://api.zinipay.com/v1/payment/create'

SUBSCRIPTION_DURATIONS: dict[str, timedelta] = {
    BillingInterval.MONTHLY: timedelta(days=30),
    BillingInterval.YEARLY: timedelta(days=365),
}

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

        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
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

        payload = {
            'amount': str(amount),
            'redirect_url': f"{settings.FRONTEND_URL}/payment/success",
            'cancel_url': f"{settings.FRONTEND_URL}/payment/cancel",
            'webhook_url': f"{settings.BACKEND_URL}/payments/webhook/",
            'cus_email': request.user.email,
            'cus_name': f"{account.first_name} {account.last_name}",
            'metadata': {
                'payment_id': str(payment.id),
                'billing_interval': billing_interval,
            },
        }

        try:
            response = requests.post(
                ZINIPAY_API_URL,
                json=payload,
                headers={
                    'zini-api-key': settings.ZINIPAY_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            logger.error("ZiniPay API error: %s", e)
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Payment gateway error. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'payment_url': data.get('payment_url')}, status=status.HTTP_201_CREATED)


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
    Updates the Payment record and Account subscription fields on success.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
        except (json.JSONDecodeError, AttributeError):
            return Response({'detail': 'Invalid JSON.'}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = data.get('transaction_id', '')
        invoice_id = data.get('invoiceId', '')
        payment_status = data.get('status', '')
        metadata = data.get('metadata', {})
        payment_method = data.get('paymentMethod', '')

        payment_id = metadata.get('payment_id')
        if not payment_id:
            logger.warning("Webhook received without payment_id in metadata.")
            return Response({'detail': 'Missing payment_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('account').get(id=payment_id)
        except Payment.DoesNotExist:
            logger.warning("Webhook: Payment %s not found.", payment_id)
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment.transaction_id = transaction_id
        payment.invoice_id = invoice_id
        payment.payment_method = payment_method
        payment.metadata = data

        if payment_status == 'COMPLETED':
            payment.status = PaymentStatus.COMPLETED

            now = timezone.now()
            duration = SUBSCRIPTION_DURATIONS.get(payment.billing_interval, timedelta(days=30))

            account = payment.account
            account.tier_plan = TierPlan.PAID
            account.billing_interval = payment.billing_interval
            account.subscription_status = SubscriptionStatus.ACTIVE
            account.subscription_start_date = now
            account.subscription_end_date = now + duration
            account.save(update_fields=[
                'tier_plan', 'billing_interval', 'subscription_status',
                'subscription_start_date', 'subscription_end_date', 'updated_at',
            ])
        elif payment_status == 'FAILED':
            payment.status = PaymentStatus.FAILED
        elif payment_status == 'CANCELLED':
            payment.status = PaymentStatus.CANCELLED

        payment.save(update_fields=['transaction_id', 'invoice_id', 'payment_method', 'metadata', 'status', 'updated_at'])

        return Response({'detail': 'OK'}, status=status.HTTP_200_OK)


@extend_schema(request=InitiatePaymentSerializer)
class InitiateStripePaymentView(APIView):
    """
    POST: Initiates a Stripe Checkout Session.
    Returns a payment URL for the frontend to redirect the user to.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        billing_interval = serializer.validated_data['billing_interval']  # type: ignore

        try:
            account = Account.objects.get(user=request.user)
        except Account.DoesNotExist:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        price_ids: dict[str, str] = {
            BillingInterval.MONTHLY: settings.STRIPE_MONTHLY_PRICE_ID,
            BillingInterval.YEARLY: settings.STRIPE_YEARLY_PRICE_ID,
        }
        prices: dict[str, object] = {
            BillingInterval.MONTHLY: settings.ZINIPAY_MONTHLY_PRICE,
            BillingInterval.YEARLY: settings.ZINIPAY_YEARLY_PRICE,
        }

        price_id = price_ids.get(billing_interval, '')
        amount = prices[billing_interval]

        payment = Payment.objects.create(
            account=account,
            amount=amount,
            billing_interval=billing_interval,
            status=PaymentStatus.PENDING,
            payment_method='stripe',
        )

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{'price': price_id, 'quantity': 1}],
                mode='subscription',
                success_url=f"{settings.FRONTEND_URL}/payment/success",
                cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
                customer_email=request.user.email,
                metadata={
                    'payment_id': str(payment.id),
                    'billing_interval': billing_interval,
                },
            )
        except stripe.StripeError as e:
            logger.error("Stripe API error: %s", e)
            payment.status = PaymentStatus.FAILED
            payment.save(update_fields=['status', 'updated_at'])
            return Response({'detail': 'Payment gateway error. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'payment_url': session.url}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    POST: Receives payment notifications from Stripe.
    Updates the Payment record and Account subscription fields on success.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.errors.SignatureVerificationError:
            logger.warning("Stripe webhook signature verification failed.")
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Stripe webhook error: %s", e)
            return Response({'detail': 'Webhook error.'}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] != 'checkout.session.completed':
            return Response({'detail': 'OK'}, status=status.HTTP_200_OK)

        session = event['data']['object']
        metadata = session.get('metadata', {})
        payment_id = metadata.get('payment_id')

        if not payment_id:
            logger.warning("Stripe webhook received without payment_id in metadata.")
            return Response({'detail': 'Missing payment_id.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('account').get(id=payment_id)
        except Payment.DoesNotExist:
            logger.warning("Stripe webhook: Payment %s not found.", payment_id)
            return Response({'detail': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        payment.transaction_id = session.get('subscription', '') or session.get('payment_intent', '')
        payment.invoice_id = session.get('id', '')
        payment.metadata = dict(session)
        payment.status = PaymentStatus.COMPLETED

        now = timezone.now()
        duration = SUBSCRIPTION_DURATIONS.get(payment.billing_interval, timedelta(days=30))

        account = payment.account
        account.tier_plan = TierPlan.PAID
        account.billing_interval = payment.billing_interval
        account.subscription_status = SubscriptionStatus.ACTIVE
        account.subscription_start_date = now
        account.subscription_end_date = now + duration
        account.save(update_fields=[
            'tier_plan', 'billing_interval', 'subscription_status',
            'subscription_start_date', 'subscription_end_date', 'updated_at',
        ])

        payment.save(update_fields=['transaction_id', 'invoice_id', 'metadata', 'status', 'updated_at'])

        return Response({'detail': 'OK'}, status=status.HTTP_200_OK)
