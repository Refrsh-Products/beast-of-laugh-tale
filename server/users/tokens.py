from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    One-time token generator for email-verification links.

    Hashes `is_active` into the signature so the token becomes invalid the
    instant the user is verified — preventing replay of an already-used link.
    Expiration is inherited from Django's PASSWORD_RESET_TIMEOUT (default: 3 days).
    """

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.email}{user.is_active}{timestamp}" # type: ignore


email_verification_token = EmailVerificationTokenGenerator()
