from django.conf import settings
import logging
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from users.services import email_service
from users.tokens import email_verification_token

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """Generate a one-time verification token for the user and email the link."""
    token = email_verification_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(str(user.pk)))
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    if settings.DEBUG:
        logger.info("[EmailVerification] Verify URL: %s", verify_url)
    
    email_service.send_template_email(
        to=user.email,
        subject='Verify your email address',
        template_name='emails/verify_email.html',
        context={'verify_url': verify_url},
        from_email=settings.VERIFICATION_FROM_EMAIL,
    )
