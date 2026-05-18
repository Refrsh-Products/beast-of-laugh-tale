from django import forms
from django.contrib import admin, messages
from django.db import transaction
from django.db.models import Count
from django.shortcuts import render
from django.urls import reverse
from django.utils.html import format_html

from payments.models import Payment, PaymentStatus

from .models import Account, BillingInterval, DailyUsage, TierPlan
from .services.downgrade import downgrade_account_to_free
from .services.upgrade import upgrade_account_to_pro


class UpgradeAccountsForm(forms.Form):
    billing_interval = forms.ChoiceField(
        choices=BillingInterval.choices,
        label='Billing interval',
    )
    note = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 2}),
        help_text='Optional note saved on the audit Payment row (e.g. ticket #, reason).',
    )


class DailyUsageInline(admin.TabularInline):
    model = DailyUsage
    extra = 0
    can_delete = False
    readonly_fields = ('date', 'quizzes_generated')
    ordering = ('-date',)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = (
        'email',
        'full_name',
        'tier_plan',
        'subscription_status',
        'billing_interval',
        'subscription_end_date',
        'payments_link',
        'created_at',
    )
    list_filter = (
        'tier_plan',
        'subscription_status',
        'billing_interval',
        'onboarding_completed',
    )
    search_fields = (
        'user__email',
        'first_name',
        'last_name',
        'phone',
        'city',
        'postal_code',
    )
    ordering = ('-created_at',)
    autocomplete_fields = ('user',)
    readonly_fields = (
        'id',
        'email',
        'registration_method',
        'user_is_active',
        'user_last_login',
        'user_created_at',
        'created_at',
        'updated_at',
        'storage_bytes_used',
        'presentations_generated',
        'payments_link',
    )
    fieldsets = (
        ('Identity Verification', {
            'description': 'Use these fields to confirm the caller is who they claim to be.',
            'fields': (
                'email',
                'first_name',
                'last_name',
                'phone',
                'address1',
                'address2',
                'city',
                'postal_code',
                'registration_method',
                'user_is_active',
                'user_last_login',
                'user_created_at',
            ),
        }),
        ('Subscription', {
            'fields': (
                'tier_plan',
                'subscription_status',
                'billing_interval',
                'subscription_start_date',
                'subscription_end_date',
                'payments_link',
            ),
        }),
        ('Usage', {
            'fields': (
                'onboarding_completed',
                'presentations_generated',
                'storage_bytes_used',
            ),
        }),
        ('System', {
            'classes': ('collapse',),
            'fields': ('id', 'user', 'profile_picture_url', 'created_at', 'updated_at'),
        }),
    )
    inlines = [DailyUsageInline]
    actions = ('upgrade_to_paid', 'downgrade_to_free')

    @admin.action(description='Upgrade selected accounts to PAID')
    def upgrade_to_paid(self, request, queryset):
        if 'apply' in request.POST:
            form = UpgradeAccountsForm(request.POST)
            if form.is_valid():
                interval = form.cleaned_data['billing_interval']
                note = form.cleaned_data['note']
                upgraded = 0
                for account in queryset.select_related('user'):
                    with transaction.atomic():
                        Payment.objects.create(
                            account=account,
                            amount=0,
                            currency='BDT',
                            billing_interval=interval,
                            status=PaymentStatus.COMPLETED,
                            payment_method='admin_comp',
                            metadata={
                                'admin_override': True,
                                'granted_by': request.user.email,
                                'note': note,
                            },
                        )
                        upgrade_account_to_pro(account, interval)
                    upgraded += 1
                self.message_user(
                    request,
                    f'Upgraded {upgraded} account(s) to PAID ({interval}).',
                    level=messages.SUCCESS,
                )
                return None

        form = UpgradeAccountsForm()
        return render(request, 'admin/accounts/account/upgrade_intermediate.html', {
            'accounts': queryset,
            'form': form,
            'action': 'upgrade_to_paid',
            'title': 'Upgrade accounts to PAID',
            'opts': self.model._meta,
        })

    @admin.action(description='Downgrade selected accounts to FREE')
    def downgrade_to_free(self, request, queryset):
        if 'apply' in request.POST:
            downgraded = 0
            for account in queryset.select_related('user'):
                if account.tier_plan == TierPlan.FREE:
                    continue
                downgrade_account_to_free(account)
                downgraded += 1
            self.message_user(
                request,
                f'Downgraded {downgraded} account(s) to FREE (overflow notebooks archived).',
                level=messages.SUCCESS,
            )
            return None

        return render(request, 'admin/accounts/account/downgrade_intermediate.html', {
            'accounts': queryset,
            'action': 'downgrade_to_free',
            'title': 'Downgrade accounts to FREE',
            'opts': self.model._meta,
        })

    @admin.display(description='Email', ordering='user__email')
    def email(self, obj):
        return obj.user.email if obj.user_id else '—'

    @admin.display(description='Name')
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or '—'

    @admin.display(description='Registration method')
    def registration_method(self, obj):
        return obj.user.registration_method if obj.user_id else '—'

    @admin.display(description='User active', boolean=True)
    def user_is_active(self, obj):
        return bool(obj.user_id and obj.user.is_active)

    @admin.display(description='Last login')
    def user_last_login(self, obj):
        return obj.user.last_login if obj.user_id else None

    @admin.display(description='User created at')
    def user_created_at(self, obj):
        return obj.user.created_at if obj.user_id else None

    @admin.display(description='Payments', ordering='payment_count')
    def payments_link(self, obj):
        count = getattr(obj, 'payment_count', None)
        if count is None:
            count = obj.payments.count()
        url = (
            reverse('admin:payments_payment_changelist')
            + f'?account__id__exact={obj.pk}'
        )
        return format_html('<a href="{}">View {} payment(s)</a>', url, count)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related('user')
            .annotate(payment_count=Count('payments'))
        )
