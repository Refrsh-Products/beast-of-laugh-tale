from django.conf import settings

from users.services import email_service


def send_welcome_email(user):
    """Send the welcome/intro email to a newly created account.

    Sent once per account on creation (both email/password registration and
    first-time Google sign-in) — not on the verification-resend path, since
    that reuses an existing account.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    email_service.send_template_email(
        to=user.email,
        subject='Welcome to FRESHR',
        template_name='emails/welcome.html',
        context={'dashboard_url': f"{frontend_url}/dashboard"},
        from_email=settings.WELCOME_FROM_EMAIL,
    )
