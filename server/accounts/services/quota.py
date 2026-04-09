from datetime import date

from django.conf import settings
from django.utils import timezone

from accounts.models import Account, TierPlan, SubscriptionStatus, DailyUsage
from notebooks.models import Notebook


def get_effective_plan(account: Account):
    if (
        account.tier_plan == TierPlan.PAID
        and account.subscription_status == SubscriptionStatus.ACTIVE
        and account.subscription_end_date is not None
        and account.subscription_end_date > timezone.now()
    ):
        return "PAID"
    return "FREE"


def get_limits(plan: str):
    return settings.FRESHR_TIER_LIMITS.get(plan, settings.FRESHR_TIER_LIMITS["FREE"])


def check_notebook_quota(account: Account):
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_notebooks = limits["max_notebooks"]
    if max_notebooks == "unlimited":
        return True
    notebook_count = Notebook.objects.filter(user=account.user).count()
    return notebook_count < max_notebooks


def check_storage_quota(account: Account, incoming_bytes: int):
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_bytes = limits["storage_mega_bytes"] * 1024 * 1024
    return (account.storage_bytes_used + incoming_bytes) <= max_bytes


def check_daily_quiz_quota(account: Account):
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_quizzes = limits["max_quizzes_per_notebook"]
    if max_quizzes == "unlimited":
        return True
    today = date.today()
    usage, _ = DailyUsage.objects.get_or_create(account=account, date=today)
    return usage.quizzes_generated < max_quizzes
