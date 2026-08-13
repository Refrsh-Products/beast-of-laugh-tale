import secrets
import uuid
from django.db import models
from accounts.models import Account, BillingInterval

DEFAULT_FALLBACK_HEADLINE = 'Online payment is temporarily unavailable'
DEFAULT_FALLBACK_MESSAGE = (
    "We're sorry for the inconvenience — our payment gateway is down while we finish "
    "setting up bKash. You can still upgrade: leave your details below and someone from "
    "our team will contact you to get your paid access sorted."
)

class PaymentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='payments')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    invoice_id = models.CharField(max_length=100, blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='BDT')
    billing_interval = models.CharField(max_length=10, choices=BillingInterval.choices)
    status = models.CharField(max_length=15, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_method = models.CharField(max_length=50, blank=True, default='')
    referral_code = models.CharField(max_length=50, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.account} - {self.billing_interval} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class PaymentFallbackSettings(models.Model):
    """
    Singleton row controlling the manual-upgrade fallback shown in place of
    checkout when the payment gateway is unavailable.

    Toggled from the Django admin so a gateway outage can be handled without a
    deploy. The copy lives here too — outage messaging changes more often than
    the frontend does, and editing it should not require a release.
    """

    enabled = models.BooleanField(
        default=False,
        help_text='When on, the billing page hides checkout and shows the contact-sales form instead.',
    )
    headline = models.CharField(max_length=200, default=DEFAULT_FALLBACK_HEADLINE)
    message = models.TextField(default=DEFAULT_FALLBACK_MESSAGE)
    whatsapp_number = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Sales WhatsApp number in international format, digits only (e.g. 8801712345678).',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Payment fallback settings'
        verbose_name_plural = 'Payment fallback settings'

    def __str__(self):
        return f"Payment fallback ({'enabled' if self.enabled else 'disabled'})"

    def save(self, *args, **kwargs):
        # Pin to a single row so `load()` can never race two rows into existence.
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise NotImplementedError('PaymentFallbackSettings is a singleton and cannot be deleted.')

    @classmethod
    def load(cls) -> 'PaymentFallbackSettings':
        settings_row, _ = cls.objects.get_or_create(pk=1)
        return settings_row

    @property
    def whatsapp_url(self) -> str:
        """Bare wa.me link. Callers append their own prefilled `?text=`."""
        digits = ''.join(c for c in self.whatsapp_number if c.isdigit())
        return f"https://wa.me/{digits}" if digits else ''


class AssistanceRequestStatus(models.TextChoices):
    NEW = 'NEW', 'New'
    CONTACTED = 'CONTACTED', 'Contacted'
    CONVERTED = 'CONVERTED', 'Converted'
    LOST = 'LOST', 'Lost'


# Excludes 0/O/1/I so codes read back unambiguously over a phone or chat.
REFERENCE_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
REFERENCE_CODE_LENGTH = 6


def generate_reference_code() -> str:
    suffix = ''.join(secrets.choice(REFERENCE_CODE_ALPHABET) for _ in range(REFERENCE_CODE_LENGTH))
    return f"FR-{suffix}"


class PaymentAssistanceRequest(models.Model):
    """
    A user asking to be upgraded manually while the gateway is down.

    This is the sales queue: a request is worked from the admin, and the actual
    upgrade is granted with the existing `Upgrade selected accounts to PAID`
    action on Account.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_code = models.CharField(max_length=12, unique=True, db_index=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='assistance_requests')
    billing_interval = models.CharField(max_length=10, choices=BillingInterval.choices)
    # Carried over from checkout so sales honours the discount the user was shown.
    referral_code = models.CharField(max_length=50, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(
        max_length=15,
        choices=AssistanceRequestStatus.choices,
        default=AssistanceRequestStatus.NEW,
    )
    handled_by = models.CharField(max_length=254, blank=True, default='')
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    OPEN_STATUSES = (AssistanceRequestStatus.NEW, AssistanceRequestStatus.CONTACTED)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_code} - {self.account} - {self.status}"

    def save(self, *args, **kwargs):
        if not self.reference_code:
            # Collisions are vanishingly rare at 32^6, but a duplicate would
            # surface as an IntegrityError on an otherwise valid request.
            for _ in range(5):
                candidate = generate_reference_code()
                if not PaymentAssistanceRequest.objects.filter(reference_code=candidate).exists():
                    self.reference_code = candidate
                    break
            else:
                raise RuntimeError('Could not generate a unique assistance reference code.')
        super().save(*args, **kwargs)
