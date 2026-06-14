from datetime import date

from django.conf import settings
from django.utils import timezone

from accounts.models import Account, TierPlan, SubscriptionStatus, DailyUsage
from notebooks.models import Notebook, NotebookFile


def get_effective_plan(account: Account):
    """The current tier of the account.
        @param: account
        @return: "PAID" if paid tier or "FREE" if free tier
    """
    if (
        account.tier_plan == TierPlan.PAID
        and account.subscription_status == SubscriptionStatus.ACTIVE
        and account.subscription_end_date is not None
        and account.subscription_end_date > timezone.now()
    ):
        return "PAID"
    return "FREE"


def get_limits(plan: str):
    """The feature limits according to the current tier.
        @param: plan - this is the tier plan of the account
        @return: a dictionary of feature and their respective limits. Returns FREE tier limit by default.
    """
    return settings.FRESHR_TIER_LIMITS.get(plan, settings.FRESHR_TIER_LIMITS["FREE"])


def get_notebook_quota_counts(account: Account) -> tuple[int, int | str]:
    """Return (active_count, limit) for the account's notebook quota."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    limit = limits["max_notebooks"]
    active_count = Notebook.objects.filter(user=account.user, is_archived=False).count()
    return active_count, limit


def get_notebook_total_count(account: Account) -> int:
    """Return the total number of notebooks. Active + archived notebooks."""
    return Notebook.objects.filter(user=account.user).count()


def check_notebook_quota(account: Account):
    """Active-slot check: used when unarchiving to ensure swap stays within active cap."""
    active_count, limit = get_notebook_quota_counts(account)
    if limit == "unlimited":
        return True
    return active_count < int(limit)


def check_notebook_create_quota(account: Account):
    """Creation check: counts total notebooks (active + archived) so users can't bypass
    the cap by archive-then-create cycling. Archived notebooks must be deleted to free a slot."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    limit = limits["max_notebooks"]
    if limit == "unlimited":
        return True
    return get_notebook_total_count(account) < int(limit)

def check_file_per_notebook_quota(account: Account, notebook: Notebook):
    """Return True if the notebook has not yet reached its per-notebook file cap."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_files_per_notebook = limits["max_files_per_notebook"]
    if max_files_per_notebook == "unlimited":
        return True
    notebook_file_count = NotebookFile.objects.filter(notebook=notebook).count()
    return notebook_file_count < max_files_per_notebook

def check_size_per_file(account: Account, file_size_bytes: int) -> bool:
    """Return True if file_size_bytes is within the plan's per-file size limit."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_size_mb = limits["max_size_per_file_mega_bytes"]
    return file_size_bytes <= max_size_mb * 1024 * 1024

def check_storage_quota(account: Account, incoming_bytes: int):
    """Return True if adding incoming_bytes would keep the account within its storage cap."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_bytes = limits["storage_mega_bytes"] * 1024 * 1024
    return (account.storage_bytes_used + incoming_bytes) <= max_bytes


def check_daily_quiz_quota(account: Account):
    """Return True if the account has not exhausted today's quiz generation allowance."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_quizzes = limits["max_quizzes_per_day"]
    if max_quizzes == "unlimited":
        return True
    today = date.today()
    usage, _ = DailyUsage.objects.get_or_create(account=account, date=today)
    return usage.quizzes_generated < max_quizzes


def check_presentation_quota(account: Account):
    """Return True if the account has not reached its lifetime presentation generation cap."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    max_presentations = limits["max_presentations_total"]
    if max_presentations == "unlimited":
        return True
    return account.presentations_generated < max_presentations


def check_audio_feature_access(account: Account) -> bool:
    """Return True if the account's plan unlocks audio transcription with note generation."""
    plan = get_effective_plan(account)
    limits = get_limits(plan)
    transcription_feature = limits["audio_feature_enabled"]
    return transcription_feature
