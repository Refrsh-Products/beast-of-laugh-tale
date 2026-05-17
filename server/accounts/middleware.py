from django.db import transaction
from django.utils import timezone

from accounts.models import Account, TierPlan
from accounts.services.downgrade import downgrade_account_to_free

class SubscriptionExpiryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            try:
                account = request.user.account
            except Account.DoesNotExist:
                return self.get_response(request)
            if (account.tier_plan == TierPlan.PAID
                    and account.subscription_end_date
                    and account.subscription_end_date < timezone.now()):
                with transaction.atomic():
                    locked = Account.objects.select_for_update().get(id=account.id)
                    if (locked.tier_plan == TierPlan.PAID
                            and locked.subscription_end_date
                            and locked.subscription_end_date < timezone.now()):
                        downgrade_account_to_free(locked)
        return self.get_response(request)
