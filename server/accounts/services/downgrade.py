from django.conf import settings
from accounts.models import Account, SubscriptionStatus, TierPlan
from notebooks.models import Notebook
from django.utils import timezone


def _archive_overflow(account: Account):
    limit = settings.FRESHR_TIER_LIMITS["FREE"]["max_notebooks"]
    # We decide the notebooks to archive using least-recently-updated first
    overflow_ids = (Notebook.objects
                .filter(user=account.user, is_archived=False)
                .order_by("-last_activity_at")[limit:]
                .values_list("id", flat=True)) # notebooks that are past the free limit
    if not overflow_ids:
        return
    Notebook.objects.filter(id__in=overflow_ids).update(
        is_archived=True, archived_at=timezone.now()
    )

def downgrade_account_to_free(account: Account):
    account.tier_plan = TierPlan.FREE
    account.subscription_status = SubscriptionStatus.EXPIRED
    account.save()
