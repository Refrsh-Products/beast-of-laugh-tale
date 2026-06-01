from datetime import date
from pathlib import Path

from django.db import migrations

POLICIES = [
    ("privacy", "Privacy Policy", "freshr-privacy-policy.md"),
    ("terms", "Terms of Service", "freshr-terms-of-service.md"),
    ("refund", "Refund Policy", "freshr-refund-policy.md"),
]


def seed(apps, schema_editor):
    Policy = apps.get_model("policies", "Policy")
    # Seed data ships inside the app at policies/seed_data/ so this migration
    # works the same on a developer laptop, in CI, and inside the docker image
    # (which only mounts server/, not the sibling client/ dir).
    seed_dir = Path(__file__).resolve().parent.parent / "seed_data"
    for slug, title, filename in POLICIES:
        path = seed_dir / filename
        body = (
            path.read_text(encoding="utf-8")
            if path.exists()
            else f"# {title}\n\n(Pending content — replace via Django admin.)"
        )
        Policy.objects.update_or_create(
            slug=slug,
            version=1,
            defaults={
                "title": title,
                "body": body,
                "effective_date": date(2026, 6, 1),
                "is_active": True,
            },
        )


def unseed(apps, schema_editor):
    Policy = apps.get_model("policies", "Policy")
    Policy.objects.filter(version=1).delete()


class Migration(migrations.Migration):
    dependencies = [("policies", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
