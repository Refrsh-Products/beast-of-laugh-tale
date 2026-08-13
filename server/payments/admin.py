from django.contrib import admin

from .models import Payment, PaymentAssistanceRequest, PaymentFallbackSettings


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'account', 'billing_interval', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'billing_interval']
    search_fields = ['account__first_name', 'account__last_name', 'transaction_id', 'invoice_id']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(PaymentFallbackSettings)
class PaymentFallbackSettingsAdmin(admin.ModelAdmin):
    """
    The gateway-outage toggle. Singleton, so adding and deleting are both off —
    there is exactly one row to edit.
    """

    list_display = ['__str__', 'whatsapp_number', 'updated_at']
    readonly_fields = ['updated_at']
    fieldsets = (
        (None, {
            'fields': ('enabled',),
            'description': (
                'Turn this on when the payment gateway is down. The billing page will '
                'hide checkout entirely and show the contact-sales form instead.'
            ),
        }),
        ('Message shown to users', {
            'fields': ('headline', 'message'),
        }),
        ('Sales contact', {
            'fields': ('whatsapp_number',),
        }),
        ('System', {
            'classes': ('collapse',),
            'fields': ('updated_at',),
        }),
    )

    def has_add_permission(self, request):
        return not PaymentFallbackSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Make sure the single row exists so the changelist is never empty and
        # ops don't have to hunt for an "Add" button that isn't there.
        PaymentFallbackSettings.load()
        return super().changelist_view(request, extra_context)


@admin.register(PaymentAssistanceRequest)
class PaymentAssistanceRequestAdmin(admin.ModelAdmin):
    """
    The sales queue. Work these top-down, then grant access with the
    'Upgrade selected accounts to PAID' action on the linked Account.
    """

    list_display = [
        'reference_code',
        'account_email',
        'billing_interval',
        'referral_code',
        'phone',
        'status',
        'created_at',
    ]
    list_editable = ['status']
    list_filter = ['status', 'billing_interval', 'created_at']
    search_fields = [
        'reference_code',
        'account__user__email',
        'account__first_name',
        'account__last_name',
        'phone',
    ]
    readonly_fields = [
        'id',
        'reference_code',
        'account',
        'billing_interval',
        'referral_code',
        'phone',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Request', {
            'fields': (
                'reference_code',
                'account',
                'billing_interval',
                'referral_code',
                'phone',
                'created_at',
            ),
        }),
        ('Handling', {
            'fields': ('status', 'handled_by', 'note'),
        }),
        ('System', {
            'classes': ('collapse',),
            'fields': ('id', 'updated_at'),
        }),
    )

    def has_add_permission(self, request):
        return False

    @admin.display(description='Email', ordering='account__user__email')
    def account_email(self, obj):
        return obj.account.user.email if obj.account.user_id else '—'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('account', 'account__user')
