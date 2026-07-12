from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'normalized_email', 'is_active', 'is_staff', 'created_at', 'last_login')
    list_filter = ('is_active', 'is_staff')
    search_fields = ('email', 'normalized_email')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'normalized_email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )

    readonly_fields = ('normalized_email',)

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
