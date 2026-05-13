from celery import shared_task
from django.utils import timezone
from django.db import transaction

from accounts.models import Account, TierPlan
from accounts.services.downgrade import downgrade_account_to_free


@shared_task
def expire_subscriptions():
    expired_ids = list(Account.objects.filter(
        tier_plan=TierPlan.PAID,
        subscription_end_date__lt=timezone.now(),
    ).values_list("id", flat=True))

    for account_id in expired_ids:
        with transaction.atomic():
            account = Account.objects.select_for_update().get(id=account_id)
            if (account.tier_plan == TierPlan.PAID
                    and account.subscription_end_date
                    and account.subscription_end_date < timezone.now()):
                downgrade_account_to_free(account)
