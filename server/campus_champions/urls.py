from django.urls import path
from .views import ValidateReferralCodeView

urlpatterns = [
    path('validate/', ValidateReferralCodeView.as_view(), name='validate-referral-code'),
]
