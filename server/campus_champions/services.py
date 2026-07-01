from django.db import IntegrityError
from .models import CampusChampion, ReferralUsage


def log_referral_usage(user, gateway_transaction_id, referral_code=None):
    """
    Records that a referral code was used by a NEW paying user.
    Enforced: one user can only use a given champion's code once (DB constraint).
    Idempotent on gateway_transaction_id (safe against webhook retries).
    """
    if not referral_code:
        return None

    champion = CampusChampion.objects.filter(
        referral_code=referral_code, active=True
    ).first()

    if not champion:
        return None

    try:
        usage = ReferralUsage.objects.create(
            champion=champion,
            user=user,
            gateway_transaction_id=gateway_transaction_id,
        )
        return usage
    except IntegrityError:
        # Either: same gateway_transaction_id seen before (webhook retry), or
        # this user already used this champion's code before — either way, ignore.
        return ReferralUsage.objects.filter(
            gateway_transaction_id=gateway_transaction_id
        ).first()