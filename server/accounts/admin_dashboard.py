from datetime import timedelta

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone

from .models import Account, BillingInterval, TierPlan


def _humanize_bytes(n: int | float | None) -> str:
    value = float(n or 0)
    for unit in ('B', 'KB', 'MB', 'GB', 'TB'):
        if value < 1024:
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} PB"


def get_dashboard_metrics() -> dict:
    from presentation.models import Presentation
    from quiz.models import QuizSession

    User = get_user_model()
    now = timezone.now()
    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    thirty_days_ago = now - timedelta(days=30)

    paid_qs = Account.objects.filter(tier_plan=TierPlan.PAID)
    storage_total = Account.objects.aggregate(total=Sum('storage_bytes_used'))['total'] or 0

    return {
        'dashboard_metrics': {
            'users': {
                'active_30d': User.objects.filter(last_login__gte=thirty_days_ago).count(),
                'new_today': User.objects.filter(created_at__date=today).count(),
                'new_this_week': User.objects.filter(created_at__date__gte=week_start).count(),
                'new_this_month': User.objects.filter(created_at__date__gte=month_start).count(),
                'free': Account.objects.filter(tier_plan=TierPlan.FREE).count(),
                'paid_total': paid_qs.count(),
                'paid_monthly': paid_qs.filter(billing_interval=BillingInterval.MONTHLY).count(),
                'paid_yearly': paid_qs.filter(billing_interval=BillingInterval.YEARLY).count(),
            },
            'usage': {
                'quizzes_today': QuizSession.objects.filter(generated_at__date=today).count(),
                'presentations_today': Presentation.objects.filter(generated_at__date=today).count(),
                'storage_total_human': _humanize_bytes(storage_total),
                'storage_total_bytes': storage_total,
            },
        }
    }


def install_dashboard() -> None:
    original_index = admin.AdminSite.index

    def patched_index(self, request, extra_context=None):
        ctx = dict(extra_context or {})
        ctx.update(get_dashboard_metrics())
        return original_index(self, request, extra_context=ctx)

    admin.AdminSite.index = patched_index
    admin.site.index_template = 'admin/dashboard.html'
    admin.site.site_header = 'FRESHR Administration'
    admin.site.site_title = 'FRESHR Administration'
    admin.site.index_title = 'FRESHR Administration'
