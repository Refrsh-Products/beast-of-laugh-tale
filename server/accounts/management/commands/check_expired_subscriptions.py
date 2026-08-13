from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Account, TierPlan


class Command(BaseCommand):
    help = (
        "Health check for the expire_subscriptions job: reports PAID accounts "
        "whose subscription end date is past a grace window (i.e. that should "
        "already have been downgraded). Exits 1 if any are found."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--grace-minutes",
            type=int,
            default=90,
            help=(
                "How long past the end date to tolerate before flagging, in "
                "minutes. Defaults to 90 (the hourly job plus slack)."
            ),
        )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(minutes=options["grace_minutes"])
        stale = Account.objects.filter(
            tier_plan=TierPlan.PAID,
            subscription_end_date__lt=cutoff,
        ).order_by("subscription_end_date")

        count = stale.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("OK: no overdue PAID accounts"))
            return

        self.stderr.write(
            self.style.ERROR(f"STALE: {count} overdue PAID account(s):")
        )
        for account_id, end in stale.values_list("id", "subscription_end_date")[:20]:
            self.stderr.write(f"  account={account_id} end={end.isoformat()}")

        # Non-zero exit so cron/monitors can alert on failure.
        raise SystemExit(1)
