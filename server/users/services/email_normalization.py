"""Email canonicalization for duplicate-account detection.

This is deliberately separate from the `email` field itself: `User.email` keeps
whatever the user typed (or whatever Google returned) because it's used for
login and for sending mail. `normalize_email()` instead produces a canonical
form used only to catch alias-based duplicate signups — e.g. Gmail treats
"sakif.hossain@gmail.com" and "sakifhossain@gmail.com" as the same inbox, and
most providers treat "user+anything@domain" as an alias of "user@domain".
Without this, a user can register unlimited "distinct" accounts against a
single real inbox and abuse free-tier limits.
"""

GMAIL_DOMAINS = frozenset({"gmail.com", "googlemail.com"})


def normalize_email(email: str) -> str:
    email = email.strip().lower()
    local, sep, domain = email.partition("@")
    if not sep:
        return email

    local = local.split("+", 1)[0]
    if domain in GMAIL_DOMAINS:
        local = local.replace(".", "")

    return f"{local}@{domain}"
