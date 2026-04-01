import factory
from factory.django import DjangoModelFactory
from users.models import User


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
