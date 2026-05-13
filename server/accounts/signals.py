from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from accounts.models import Account, TierPlan
from accounts.services.downgrade import _archive_overflow

_TIER_BEFORE_ATTR = "_tier_plan_before_save"


@receiver(pre_save, sender=Account)
def _stash_previous_tier(sender, instance: Account, **kwargs):
    if not instance.pk:
        setattr(instance, _TIER_BEFORE_ATTR, None)
        return
    try:
        previous = Account.objects.only("tier_plan").get(pk=instance.pk).tier_plan
    except Account.DoesNotExist:
        previous = None
    setattr(instance, _TIER_BEFORE_ATTR, previous)


@receiver(post_save, sender=Account)
def _archive_on_downgrade(sender, instance: Account, created, **kwargs):
    if created:
        return
    previous = getattr(instance, _TIER_BEFORE_ATTR, None)
    if previous == TierPlan.PAID and instance.tier_plan == TierPlan.FREE:
        _archive_overflow(instance)
