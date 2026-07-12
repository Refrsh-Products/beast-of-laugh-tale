import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

from users.services.email_normalization import normalize_email


REGISTRATION_CHOICES = [
    ('email', 'Email'),
    ('google', 'Google')
]


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, help_text="The user's unique email address.")
    normalized_email = models.EmailField(
        db_index=True,
        editable=False,
        default="",
        help_text="Canonical form of `email` (lowercased, +tag and Gmail dots stripped), "
                   "used to detect alias-based duplicate signups against the same inbox.",
    )

    registration_method = models.CharField(max_length=20, choices=REGISTRATION_CHOICES, default='email')

    is_active = models.BooleanField(default=False, help_text="Indicates whether the user account is active. New email-registered users start inactive and must verify their email before this flips to True. Google-registered users are activated immediately on first sign-in.")
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False, help_text="Indicates whether the user has all admin permissions. Defaults to False.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def save(self, *args, **kwargs):
        self.normalized_email = normalize_email(self.email)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
