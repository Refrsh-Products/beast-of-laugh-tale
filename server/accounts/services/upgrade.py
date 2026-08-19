from datetime import timedelta

from django.utils import timezone

from accounts.models import Account, BillingInterval, SubscriptionStatus, TierPlan


SUBSCRIPTION_DURATIONS: dict[str, timedelta] = {
    BillingInterval.MONTHLY: timedelta(days=30),
    BillingInterval.SEMESTER: timedelta(days=120),  # 4-month academic session
    # Legacy value; historically (wrongly) granted a full year. Left as-is so we
    # don't retroactively shorten access already sold under it. New purchases go
    # through SEMESTER.
    BillingInterval.YEARLY: timedelta(days=365),
}


def upgrade_account_to_pro(account: Account, billing_interval: str) -> Account:
    now = timezone.now()
    duration = SUBSCRIPTION_DURATIONS.get(billing_interval, timedelta(days=30))

    account.tier_plan = TierPlan.PAID
    account.billing_interval = billing_interval
    account.subscription_status = SubscriptionStatus.ACTIVE
    account.subscription_start_date = now
    account.subscription_end_date = now + duration
    account.save(update_fields=[
        'tier_plan', 'billing_interval', 'subscription_status',
        'subscription_start_date', 'subscription_end_date', 'updated_at',
    ])
    return account
