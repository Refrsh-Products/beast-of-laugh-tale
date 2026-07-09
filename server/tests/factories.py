import factory
from factory.django import DjangoModelFactory
from users.models import User
from accounts.models import Account, TierPlan
from notebooks.models import Notebook


class UserFactory(DjangoModelFactory):
    """
    Blueprint for creating User objects in tests.

    Usage:
        user = UserFactory()                          # creates a user with defaults
        user = UserFactory(email="bob@example.com")   # override specific fields
        user = UserFactory(password="Custom123!")     # override the password
        users = UserFactory.create_batch(3)           # create 3 users at once
    """

    class Meta: # type: ignore
        model = User
        skip_postgeneration_save = True  # we handle the save ourselves below

    # factory.Sequence ensures each user gets a unique email: user0@..., user1@..., etc.
    email = factory.Sequence(lambda n: f"user{n}@example.com") # type: ignore

    is_active = True
    registration_method = "email"

    @factory.post_generation # type: ignore
    def password(self, create, extracted, **kwargs):
        """
        Hashes and saves the password after the user row is created.
        'extracted' is the value passed in, e.g. UserFactory(password="Custom123!")
        Falls back to the default if nothing was passed.
        """
        raw = extracted or "TestPassword123!"
        self.set_password(raw) # type: ignore
        if create:
            self.save() # type: ignore


class AccountFactory(DjangoModelFactory):
    """
    An Account row. In production Accounts are created lazily during onboarding,
    so tests that hit quota-gated endpoints must create one explicitly.

    Usage:
        account = AccountFactory(user=user)                    # FREE tier
        account = AccountFactory(user=user, tier_plan="PAID")  # note: PAID also
            needs subscription_status ACTIVE + a future end date to be *effective*
            (see quota.get_effective_plan).
    """

    class Meta:  # type: ignore
        model = Account

    user = factory.SubFactory(UserFactory)
    first_name = "Test"
    last_name = "User"
    address1 = "123 Test St"
    city = "Testville"
    postal_code = "12345"
    phone = "0000000000"
    tier_plan = TierPlan.FREE
    storage_bytes_used = 0


class NotebookFactory(DjangoModelFactory):
    """A Notebook owned by a user."""

    class Meta:  # type: ignore
        model = Notebook

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Notebook {n}")  # type: ignore
    is_archived = False
