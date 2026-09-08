"""Publish privacy policy v2: contact number, academic details, WhatsApp community,
per-model AI processing disclosure (Sections 5.2-5.4).

Editing seed_data/*.md alone changes nothing for an environment that already ran
0002 — the DB row is authoritative once seeded. So the new text has to be
published as a new Policy version here, or staging and production silently keep
serving v1.

`uniq_active_policy_per_slug` allows exactly one active row per slug, so the
previous version must be deactivated in the same transaction (migrations run in
one by default on Postgres).
"""

from datetime import date
from pathlib import Path

from django.db import migrations

SLUG = "privacy"
VERSION = 2
FILENAME = "freshr-privacy-policy.md"
EFFECTIVE = date(2026, 9, 7)


def publish(apps, schema_editor):
    Policy = apps.get_model("policies", "Policy")

    path = Path(__file__).resolve().parent.parent / "seed_data" / FILENAME
    if not path.exists():
        # 0002 tolerates missing seed files; do the same rather than breaking deploys.
        return

    existing = Policy.objects.filter(slug=SLUG, version=VERSION).first()
    if existing and existing.is_active:
        return  # already published — re-running is a no-op

    # Stand down the current active version first: the partial unique index
    # would reject a second active row for this slug.
    Policy.objects.filter(slug=SLUG, is_active=True).update(is_active=False)

    Policy.objects.update_or_create(
        slug=SLUG,
        version=VERSION,
        defaults={
            "title": "Privacy Policy",
            "body": path.read_text(encoding="utf-8"),
            "effective_date": EFFECTIVE,
            "is_active": True,
        },
    )


def unpublish(apps, schema_editor):
    Policy = apps.get_model("policies", "Policy")
    Policy.objects.filter(slug=SLUG, version=VERSION).delete()
    # Restore v1 as the live version so the endpoint still resolves.
    Policy.objects.filter(slug=SLUG, version=1).update(is_active=True)


class Migration(migrations.Migration):
    dependencies = [("policies", "0002_seed_policies")]
    operations = [migrations.RunPython(publish, unpublish)]
