from django.urls import path
from .views import InitiatePaymentView, PaymentListView, ZiniPayWebhookView, InitiateStripePaymentView, StripeWebhookView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('stripe/initiate/', InitiateStripePaymentView.as_view(), name='payment-stripe-initiate'),
    path('', PaymentListView.as_view(), name='payment-list'),
    path('webhook/', ZiniPayWebhookView.as_view(), name='payment-webhook'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='payment-stripe-webhook'),
]
