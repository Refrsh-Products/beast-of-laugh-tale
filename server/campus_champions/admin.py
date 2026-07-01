from django.contrib import admin
from .models import CampusChampion, ReferralUsage


class ReferralUsageInline(admin.TabularInline):
    model = ReferralUsage
    extra = 0
    readonly_fields = ('user', 'gateway_transaction_id', 'created_at')
    can_delete = False
    max_num = 0


@admin.register(CampusChampion)
class CampusChampionAdmin(admin.ModelAdmin):
    inlines = [ReferralUsageInline]
    list_display = ('name', 'referral_code', 'university', 'phone_number', 'discount_percentage', 'active', 'total_referrals')
    list_filter = ('active', 'university')
    search_fields = ('name', 'referral_code', 'phone_number', 'university', 'contact_email')

    def get_fields(self, request, obj=None):
        if obj is None:  # Adding a new champion — hide referral_code, it's auto-generated
            return ('name', 'university', 'phone_number', 'contact_email', 'discount_percentage', 'active', 'notes')
        # Editing an existing champion — show it as read-only for reference
        return ('name', 'referral_code', 'university', 'phone_number', 'contact_email', 'discount_percentage', 'active', 'notes')

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return ()
        return ('referral_code',)

    def total_referrals(self, obj):
        return obj.usages.count()
    total_referrals.short_description = '# Paid Referrals' # type: ignore


@admin.register(ReferralUsage)
class ReferralUsageAdmin(admin.ModelAdmin):
    list_display = ('champion', 'user', 'created_at')
    list_filter = ('champion',)
    search_fields = ('gateway_transaction_id', 'champion__referral_code', 'user__email')
    date_hierarchy = 'created_at'
    readonly_fields = [f.name for f in ReferralUsage._meta.fields]