import uuid
from django.db import models
from django.conf import settings

class TierPlan(models.TextChoices):
    FREE = 'FREE', 'Free'
    MONTHLY = 'MONTHLY', 'Monthly'
    YEARLY = 'YEARLY', 'Yearly'


class Account(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='account',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=100, help_text="The user's first name.")
    last_name = models.CharField(max_length=100, help_text="The user's last name.")
    profile_picture_url = models.URLField(max_length=500, blank=True, default='', help_text="URL of the user's profile picture.")
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    tier_plan = models.CharField(
        max_length=10,
        choices=TierPlan.choices,
        default=TierPlan.FREE
    )
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name_plural = "accounts"
