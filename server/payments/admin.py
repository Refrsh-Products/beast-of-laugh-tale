from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'account', 'billing_interval', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'billing_interval']
    search_fields = ['account__first_name', 'account__last_name', 'transaction_id', 'invoice_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
