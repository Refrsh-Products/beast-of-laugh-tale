from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings


def send_template_email(to, subject, template_name, context, from_email=None, extra_headers=None):
    """
    Send an HTML email rendered from a Django template.

    Args:
        to: recipient email address (str) or list of addresses
        subject: email subject line
        template_name: path to template relative to any templates/ dir (e.g. 'email/password_reset.html')
        context: dict of template context variables
        from_email: sender address; defaults to settings.DEFAULT_FROM_EMAIL
        extra_headers: optional dict of extra SMTP headers (e.g. List-Unsubscribe
            for marketing sends). Transactional templates omit the footer
            unsubscribe link, so they pass nothing here.
    """
    if isinstance(to, str):
        to = [to]

    full_context = {'frontend_url': settings.FRONTEND_URL, **context}
    html_content = render_to_string(template_name, full_context)

    message = EmailMessage(
        subject=subject,
        body=html_content,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        to=to,
        headers=extra_headers or None,
    )
    message.content_subtype = "html"
    message.send()


def send_notification_email(to, title, body, cta_text=None, cta_url=None, subject=None, from_email=None):
    """
    Send the generic notification email (emails/notification.html).

    This is the fallback transactional template — password reset, verification,
    and welcome each have their own bespoke template; this one covers everything
    else. Infra only — no existing code path calls this yet. Future features
    (billing events, exports, usage limits, etc.) call this directly instead of
    building their own template.

    Args:
        to: recipient email address (str) or list of addresses
        title: headline shown in the email (e.g. "Your export is ready")
        body: main message body (plain text; multi-paragraph via blank lines)
        cta_text: button label; button is omitted entirely if cta_url is not set
        cta_url: button target URL
        subject: email subject line; defaults to `title`
        from_email: sender address; defaults to settings.NOTIFICATION_FROM_EMAIL
    """
    send_template_email(
        to=to,
        subject=subject or title,
        template_name='emails/notification.html',
        context={
            'title': title,
            'body': body,
            'cta_text': cta_text or 'View in FRESHR',
            'cta_url': cta_url,
        },
        from_email=from_email or settings.NOTIFICATION_FROM_EMAIL,
    )
