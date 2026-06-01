from django.contrib import admin
from django.utils.html import format_html

from .models import Policy


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = (
        "slug",
        "version",
        "title",
        "is_active",
        "effective_date",
        "updated_at",
    )
    list_filter = ("slug", "is_active")
    search_fields = ("slug", "title", "body")
    readonly_fields = ("id", "created_at", "updated_at", "body_preview")
    fields = (
        "slug",
        "version",
        "title",
        "effective_date",
        "is_active",
        "body",
        "body_preview",
        "id",
        "created_at",
        "updated_at",
    )
    ordering = ("slug", "-version")

    @admin.display(description="Body preview (first 800 chars)")
    def body_preview(self, obj):
        return format_html(
            "<pre style='white-space:pre-wrap;max-width:720px'>{}</pre>",
            (obj.body or "")[:800],
        )
