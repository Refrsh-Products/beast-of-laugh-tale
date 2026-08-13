from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentAssistanceRequestView,
    PaymentFallbackStatusView,
    PaymentListView,
    ZiniPayWebhookView,
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('fallback/', PaymentFallbackStatusView.as_view(), name='payment-fallback-status'),
    path('assistance/', PaymentAssistanceRequestView.as_view(), name='payment-assistance'),
    path('', PaymentListView.as_view(), name='payment-list'),
    path('webhook/', ZiniPayWebhookView.as_view(), name='payment-webhook'),
]
