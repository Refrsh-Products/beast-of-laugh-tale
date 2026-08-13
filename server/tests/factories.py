import factory
from factory.django import DjangoModelFactory
from users.models import User
from decimal import Decimal
from accounts.models import Account, BillingInterval
from payments.models import Payment
from campus_champions.models import CampusChampion


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
    Blueprint for creating Account objects in tests.
    """

    class Meta: # type: ignore
        model = Account

    user = factory.SubFactory(UserFactory) # type: ignore

    first_name = "Test"
    last_name = "User"
    address1 = "123 Test St"
    city = "Dhaka"
    postal_code = "1200"
    phone = "01700000000"
    
class PaymentFactory(DjangoModelFactory):
    """
    Blueprint for creating Payment objects in tests.
    """

    class Meta: # type: ignore
        model = Payment

    account = factory.SubFactory(AccountFactory) # type: ignore

    amount = Decimal("350.00")
    billing_interval = BillingInterval.MONTHLY


class CampusChampionFactory(DjangoModelFactory):
    """
    Blueprint for creating Campus Champion objects in tests.
    """

    class Meta: # type: ignore
        model = CampusChampion

    # The generated referral code sequence depends on name: first-3-letters-of-name + random 3 digits 
    # factory's name is constant. 
    # So every champion starts 'TES-FRE-***' with only the digits varying — 1000 combos, 10 retries.
    # If more needed during create_batch make the name Sequencial
    name = "Test Campus Champ"
    contact_email = 'example@email.com'
    university = 'Testing University'
    phone_number = '01700000000'
    notes = 'Test notes'