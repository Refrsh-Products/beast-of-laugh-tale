import uuid

from django.db import models


class Policy(models.Model):
    class Slug(models.TextChoices):
        PRIVACY = "privacy", "Privacy Policy"
        TERMS = "terms", "Terms of Service"
        REFUND = "refund", "Refund Policy"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.CharField(max_length=32, choices=Slug.choices)
    version = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    body = models.TextField(
        help_text="Markdown. Rendered with react-markdown on the frontend."
    )
    effective_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["slug", "-version"]
        constraints = [
            models.UniqueConstraint(
                fields=["slug", "version"], name="uniq_policy_slug_version"
            ),
            models.UniqueConstraint(
                fields=["slug"],
                condition=models.Q(is_active=True),
                name="uniq_active_policy_per_slug",
            ),
        ]
        verbose_name_plural = "policies"

    def __str__(self):
        return f"{self.get_slug_display()} v{self.version}"
