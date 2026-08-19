import logging

from django.conf import settings

from users.models import User
from users.services import email_service
from users.services.email_normalization import normalize_email
from users.services.unsubscribe import (
    build_unsubscribe_url,
    build_one_click_unsubscribe_url,
)

logger = logging.getLogger(__name__)


def send_promotional_email(recipients, subject, context):
    """Send the promotional campaign template (emails/promotional.html) to a list
    of recipients, one message per recipient.

    Sent individually rather than as one multi-recipient message so recipients
    never see each other's addresses, a single bad address can't abort the rest
    of the batch (failures are collected, not raised), and each message carries
    its own per-recipient unsubscribe link and List-Unsubscribe headers.

    Recipients who have opted out of marketing email are dropped up front and
    returned in `skipped`.

    Args:
        recipients: list of recipient email addresses
        subject: email subject line
        context: template context (eyebrow, heading, body, cta_text, cta_url,
            and optionally offer_eyebrow/offer_body/offer_cta_text/offer_cta_url)

    Returns: (sent, failed, skipped) — lists of recipient email addresses
    """
    opted_out = set(
        User.objects.filter(marketing_unsubscribed_at__isnull=False)
        .values_list('normalized_email', flat=True)
    )

    sent, failed, skipped = [], [], []
    for recipient in recipients:
        if normalize_email(recipient) in opted_out:
            skipped.append(recipient)
            continue

        unsubscribe_url = build_unsubscribe_url(recipient)
        one_click_url = build_one_click_unsubscribe_url(recipient)
        try:
            email_service.send_template_email(
                to=recipient,
                subject=subject,
                template_name='emails/promotional.html',
                context={**context, 'unsubscribe_url': unsubscribe_url},
                from_email=settings.PROMOTIONAL_FROM_EMAIL,
                # RFC 8058: the one-click POST endpoint goes first, then the
                # human-facing page as a fallback for clients without one-click.
                extra_headers={
                    'List-Unsubscribe': f'<{one_click_url}>, <{unsubscribe_url}>',
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                },
            )
            sent.append(recipient)
        except Exception as e:
            logger.error(
                "[PromotionalEmail] Failed to send to %s: %s: %s",
                recipient, type(e).__name__, e,
            )
            failed.append(recipient)
    return sent, failed, skipped
