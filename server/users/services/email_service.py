from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings


def send_template_email(to, subject, template_name, context, from_email=None):
    """
    Send an HTML email rendered from a Django template.

    Args:
        to: recipient email address (str) or list of addresses
        subject: email subject line
        template_name: path to template relative to any templates/ dir (e.g. 'email/password_reset.html')
        context: dict of template context variables
        from_email: sender address; defaults to settings.DEFAULT_FROM_EMAIL
    """
    if isinstance(to, str):
        to = [to]

    html_content = render_to_string(template_name, context)

    message = EmailMessage(
        subject=subject,
        body=html_content,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        to=to,
    )
    message.content_subtype = "html"
    message.send()
