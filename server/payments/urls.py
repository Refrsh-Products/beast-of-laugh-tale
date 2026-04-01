from django.urls import path
from .views import InitiatePaymentView, PaymentListView, ZiniPayWebhookView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('', PaymentListView.as_view(), name='payment-list'),
    path('webhook/', ZiniPayWebhookView.as_view(), name='payment-webhook'),
]
