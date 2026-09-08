"""WhatsApp community opt-in.

There is no API — Meta's or anyone else's — that can add a person to a WhatsApp
group or community. Meta's Groups API has no add-participant endpoint, caps
groups at 8 people which is not what we want, and exposes nothing for Communities at all. 
So the whole feature is: show an invite link, and record that the user chose to open it.

That means `Account.whatsapp_community_opt_in_at` is a consent record, never a
membership record. Nothing here can confirm the user joined, or notice if they
leave.
"""

from datetime import datetime

from django.utils import timezone

from accounts.models import Account, WhatsAppCommunitySettings


def build_community_payload(
    settings_row: WhatsAppCommunitySettings,
    opted_in_at: datetime | None,
) -> dict:
    """Collapse `enabled` and `invite_url` into one honest signal.

    A client that sees `enabled: True` must always have a URL it can open, so on
    the wire `enabled` is `is_live` and the URL is blanked otherwise. That
    removes the whole "enabled but the button opens nothing" bug class from both
    frontends — their skip logic reduces to checking `enabled`.
    """
    live = settings_row.is_live
    return {
        'enabled': live,
        'invite_url': settings_row.invite_url if live else '',
        'headline': settings_row.headline,
        'message': settings_row.message,
        'opted_in_at': opted_in_at,
    }


def record_opt_in(account: Account) -> datetime | None:
    """Stamp the consent time. Idempotent — the first tap wins.

    Re-tapping from the account screen must not rewrite the original consent
    timestamp, which is what makes it usable as a consent record. Mirrors
    users.services.unsubscribe.unsubscribe_by_token.
    """
    if account.whatsapp_community_opt_in_at is None:
        account.whatsapp_community_opt_in_at = timezone.now()
        account.save(update_fields=['whatsapp_community_opt_in_at'])
    return account.whatsapp_community_opt_in_at


def clear_opt_in(account: Account) -> None:
    """Withdraw consent.

    The privacy policy promises consent-based processing can be withdrawn, and
    this is consent-based. Clearing our record does NOT remove anyone from the
    group — only they can do that, inside WhatsApp — so callers must say so.
    """
    if account.whatsapp_community_opt_in_at is not None:
        account.whatsapp_community_opt_in_at = None
        account.save(update_fields=['whatsapp_community_opt_in_at'])
