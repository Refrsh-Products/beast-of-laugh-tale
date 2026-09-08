from accounts.models import Account


def ensure_account(user, **defaults) -> Account:
    """Idempotently get-or-create an Account for `user`.

    The three fields below have no model default, so they're spelled out here to
    satisfy NOT NULL without forcing the user to fill anything in. Every other
    string field (the address, university, year of study) carries
    `blank=True, default=''` on the model and needs no entry.
    `onboarding_completed` stays False until the user finishes the onboarding
    form. Callers may pass `first_name`, `last_name`, `profile_picture_url`,
    etc. via `defaults` to prefill from an OAuth provider; None values are
    dropped so they don't clobber existing data.
    """
    stub = {
        "first_name": "",
        "last_name": "",
        "phone": "",
        "onboarding_completed": False,
    }
    stub.update({k: v for k, v in defaults.items() if v is not None})
    account, _ = Account.objects.get_or_create(user=user, defaults=stub)
    return account
