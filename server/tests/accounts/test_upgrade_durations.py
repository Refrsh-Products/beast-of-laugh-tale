"""
Tests for subscription durations granted by `upgrade_account_to_pro`.

The semester plan is the reason this file exists: it was historically checked out
under the `YEARLY` interval, which granted a full 365 days of access for a 4-month
purchase. `SEMESTER` must grant 120 days.
"""

from datetime import timedelta

import pytest

from accounts.models import BillingInterval, SubscriptionStatus, TierPlan
from accounts.services.upgrade import upgrade_account_to_pro
from tests.factories import AccountFactory

pytestmark = pytest.mark.django_db


def _duration_days(account):
    return (account.subscription_end_date - account.subscription_start_date).days


def test_semester_grants_four_months():
    account = AccountFactory()

    upgrade_account_to_pro(account, BillingInterval.SEMESTER)

    account.refresh_from_db()
    assert account.tier_plan == TierPlan.PAID
    assert account.subscription_status == SubscriptionStatus.ACTIVE
    assert account.billing_interval == BillingInterval.SEMESTER
    assert _duration_days(account) == timedelta(days=120).days


def test_monthly_grants_thirty_days():
    account = AccountFactory()

    upgrade_account_to_pro(account, BillingInterval.MONTHLY)

    account.refresh_from_db()
    assert _duration_days(account) == timedelta(days=30).days
