import random
import re
import uuid
from django.db import models
from django.conf import settings


class CampusChampion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Name of the campus champion.")
    referral_code = models.CharField(max_length=50, unique=True, db_index=True)
    active = models.BooleanField(default=True)
    contact_email = models.EmailField(blank=True)
    university = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    discount_percentage = models.PositiveIntegerField(
        default=10,
        help_text="Discount percentage (0–100) applied when this champion's code is used.",
    )
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def generate_referral_code(self):
        # First 3 letters of name, alphabetic only, padded if name is short
        letters = re.sub(r'[^a-zA-Z]', '', self.name)[:3].upper()
        letters = letters.ljust(3, 'X')  # pad with X if name has fewer than 3 letters

        for _ in range(10):  # retry a few times on collision
            digits = ''.join(random.choices('0123456789', k=3))
            code = f"{letters}-FRE-{digits}"
            if not CampusChampion.objects.filter(referral_code=code).exclude(pk=self.pk).exists():
                return code

        raise ValueError("Could not generate a unique referral code after 10 attempts.")
    
    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.referral_code})"
    
    @property
    def total_referrals(self):
        return self.usages.count() # type: ignore


class ReferralUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    champion = models.ForeignKey(
        CampusChampion, on_delete=models.SET_NULL, null=True,
        related_name='usages'
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Idempotency guard against duplicate webhook deliveries
    gateway_transaction_id = models.CharField(max_length=255, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['champion', 'user'],
                name='unique_champion_user_referral'
            )
        ]

    def __str__(self):
        return f"{self.champion} referred {self.user} on {self.created_at:%Y-%m-%d}"