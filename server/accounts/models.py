import uuid
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class TierPlan(models.TextChoices):
    FREE = 'FREE', 'Free'
    PAID = 'PAID', 'Paid'


class BillingInterval(models.TextChoices):
    MONTHLY = 'MONTHLY', 'Monthly'
    SEMESTER = 'SEMESTER', 'Semester'       # 4-month academic session
    # Legacy: the old name for the semester plan. It wrongly granted a full year
    # of access, so new checkouts use SEMESTER. Kept so existing subscriptions
    # still validate and read back correctly.
    YEARLY = 'YEARLY', 'Yearly'


class SubscriptionStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    CANCELLED = 'CANCELLED', 'Cancelled'
    EXPIRED = 'EXPIRED', 'Expired'


class YearOfStudy(models.TextChoices):
    YEAR_1 = 'YEAR_1', '1st Year'
    YEAR_2 = 'YEAR_2', '2nd Year'
    YEAR_3 = 'YEAR_3', '3rd Year'
    YEAR_4 = 'YEAR_4', '4th Year'
    # Medicine, architecture and some engineering programmes run 5-6 years.
    YEAR_5 = 'YEAR_5', '5th Year'
    YEAR_6 = 'YEAR_6', '6th Year'
    MASTERS = 'MASTERS', 'Masters/Postgrad'
    GRADUATED = 'GRADUATED', 'Graduated'


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
    address1 = models.CharField(max_length=255, blank=True, default='')
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, default='')
    postal_code = models.CharField(max_length=20, blank=True, default='')
    phone = models.CharField(max_length=20)
    university = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text=(
            "The user's university. Free text: picked from a curated list on the "
            "client, or typed in when they choose 'Other'."
        ),
    )
    year_of_study = models.CharField(
        max_length=12,
        choices=YearOfStudy.choices,
        blank=True,
        default='',
        help_text="Where the user is in their degree. Blank means they didn't say.",
    )
    whatsapp_community_opt_in_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "When the user tapped 'Join community' and we opened the WhatsApp invite "
            "for them. This records consent and intent ONLY — WhatsApp exposes no way "
            "to verify that they actually joined the group, and we will never know if "
            "they later leave. Null means they never tapped it."
        ),
    )
    tier_plan = models.CharField(
        max_length=10,
        choices=TierPlan.choices,
        default=TierPlan.FREE
    )
    billing_interval = models.CharField(
        max_length=10,
        choices=BillingInterval.choices,
        null=True,
        blank=True
    )
    subscription_status = models.CharField(
        max_length=15,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.INACTIVE
    )
    subscription_start_date = models.DateTimeField(null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    onboarding_completed = models.BooleanField(default=False)
    storage_bytes_used = models.BigIntegerField(default=0)
    presentations_generated = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name_plural = "accounts"


class DailyUsage(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    date = models.DateField()
    quizzes_generated = models.IntegerField(default=0)

    class Meta:
        unique_together = ("account", "date")


DEFAULT_COMMUNITY_HEADLINE = 'Join the FRESHR student community'
DEFAULT_COMMUNITY_MESSAGE = (
    "Study tips, feature updates and a direct line to the team — plus students "
    "from other campuses. It's a WhatsApp group, and you can leave any time."
)

ALLOWED_INVITE_HOSTS = frozenset({'chat.whatsapp.com'})


def validate_whatsapp_invite_url(value: str) -> None:
    """Stop an admin typo from pointing every new user at an arbitrary site.

    Only runs via full_clean() — which the admin form calls but Model.save()
    does not. That's enough here because the admin is the only write path; no
    API endpoint writes this model.
    """
    if not value:
        return
    parsed = urlparse(value)
    if parsed.scheme != 'https' or parsed.netloc.lower() not in ALLOWED_INVITE_HOSTS:
        raise ValidationError(
            'Must be an https://chat.whatsapp.com/... group invite link. '
            'If Meta ever changes the host, widen ALLOWED_INVITE_HOSTS.'
        )


class WhatsAppCommunitySettings(models.Model):
    """Admin-editable settings for the optional WhatsApp community invite.

    Singleton, mirroring PaymentFallbackSettings. Ships dark (`enabled` defaults
    False) so merging is safe — going live is a toggle plus pasting the link.

    Note there is no API to add anyone to a WhatsApp group or community, so this
    is only ever an invite link the user chooses to open.
    """

    enabled = models.BooleanField(
        default=False,
        help_text='When on, onboarding shows the community step and the account page shows a join card.',
    )
    invite_url = models.URLField(
        max_length=500,
        blank=True,
        default='',
        validators=[validate_whatsapp_invite_url],
        help_text=(
            'The https://chat.whatsapp.com/... group invite link. '
            'WARNING: resetting or revoking the invite inside WhatsApp — or the group '
            'reaching its participant limit — silently breaks the button with no signal '
            'on our side. Re-paste the link after any reset.'
        ),
    )
    headline = models.CharField(max_length=200, default=DEFAULT_COMMUNITY_HEADLINE)
    message = models.TextField(default=DEFAULT_COMMUNITY_MESSAGE)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'WhatsApp community settings'
        verbose_name_plural = 'WhatsApp community settings'

    def __str__(self):
        return f"WhatsApp community ({'enabled' if self.enabled else 'disabled'})"

    def save(self, *args, **kwargs):
        # Pin to a single row so `load()` can never race two rows into existence.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise NotImplementedError('WhatsAppCommunitySettings is a singleton and cannot be deleted.')

    @classmethod
    def load(cls) -> 'WhatsAppCommunitySettings':
        settings_row, _ = cls.objects.get_or_create(pk=1)
        return settings_row

    @property
    def is_live(self) -> bool:
        """Enabled AND actually openable. Clients only ever see this, never the
        raw `enabled`, so 'on but the button opens nothing' can't happen."""
        return self.enabled and bool(self.invite_url.strip())