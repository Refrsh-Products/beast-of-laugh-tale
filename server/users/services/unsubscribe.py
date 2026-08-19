import logging

from django.core import signing
from django.conf import settings
from django.utils import timezone

from users.models import User
from users.services.email_normalization import normalize_email

logger = logging.getLogger(__name__)

# Salt namespaces these tokens so a marketing-unsubscribe token can't be replayed
# against any other signing.loads() call in the codebase.
_SALT = "marketing-unsubscribe"


def make_unsubscribe_token(email: str) -> str:
    """Sign a recipient's email into a tamper-proof, non-expiring token.

    Encodes the email (not the user id) so the link works even for recipients
    who aren't app users — e.g. an imported campaign list. Uses SECRET_KEY;
    it never expires by design (unsubscribe links must keep working forever).
    """
    return signing.dumps(email, salt=_SALT)


def build_unsubscribe_url(email: str) -> str:
    """The human-facing SPA page a recipient lands on from the footer link."""
    token = make_unsubscribe_token(email)
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return f"{frontend_url}/unsubscribe?token={token}"


def build_one_click_unsubscribe_url(email: str) -> str:
    """Absolute API URL for the RFC 8058 List-Unsubscribe-Post one-click endpoint.

    Built off FRONTEND_URL because nginx/Caddy proxy `/api/` on the public origin
    through to Django — so this resolves to the backend without a separate host.
    """
    token = make_unsubscribe_token(email)
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    return f"{frontend_url}/api/v{settings.API_VERSION}/auth/unsubscribe/one-click/{token}/"


def unsubscribe_by_token(token: str) -> bool:
    """Opt the token's email out of marketing email. Idempotent.

    Returns False only when the token is invalid/tampered; True otherwise
    (including the no-op cases: already unsubscribed, or a non-user address the
    footer link was still built for).
    """
    try:
        email = signing.loads(token, salt=_SALT)  # no max_age → never expires
    except signing.BadSignature:
        logger.warning("[Unsubscribe] Rejected invalid/tampered token")
        return False

    user = User.objects.filter(normalized_email=normalize_email(email)).first()
    if user is None:
        # Address isn't a registered user (e.g. an imported campaign recipient).
        # There's no User row to flag; treat as success so the link still confirms
        # rather than erroring at someone who legitimately asked to opt out.
        logger.info("[Unsubscribe] Token for non-user address, no-op")
        return True

    if user.marketing_unsubscribed_at is None:
        user.marketing_unsubscribed_at = timezone.now()
        user.save(update_fields=["marketing_unsubscribed_at"])
    return True
