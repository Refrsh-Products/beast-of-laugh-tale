from django.contrib import admin
from django.db.models import Count
from django.urls import reverse
from django.utils.html import format_html

from .models import Notebook, NotebookFile


class NotebookOwnerFilter(admin.SimpleListFilter):
    title = 'owner (user)'
    parameter_name = 'notebook__user__id__exact'

    def lookups(self, request, model_admin):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = (
            User.objects
            .filter(notebooks__files__isnull=False)
            .distinct()
            .order_by('email')
            .values_list('id', 'email')[:200]
        )
        return [(str(uid), email) for uid, email in users]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(notebook__user__id=self.value())
        return queryset


class NotebookFileInline(admin.TabularInline):
    model = NotebookFile
    extra = 0
    can_delete = True
    fields = ('name', 'file', 'file_type', 'ingestion_status', 'uploaded_at')
    readonly_fields = ('uploaded_at',)
    show_change_link = True


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ('title', 'user_email', 'files_link', 'is_archived', 'pinned', 'last_activity_at', 'created_at')
    list_filter = ('is_archived', 'pinned')
    search_fields = ('title', 'user__email', 'id')
    list_select_related = ('user',)
    autocomplete_fields = ('user',)
    inlines = [NotebookFileInline]
    ordering = ('-last_activity_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'archived_at')

    @admin.display(description='Owner', ordering='user__email')
    def user_email(self, obj):
        return obj.user.email if obj.user_id else '—'

    @admin.display(description='Files', ordering='file_count')
    def files_link(self, obj):
        count = getattr(obj, 'file_count', None)
        if count is None:
            count = obj.files.count()
        url = (
            reverse('admin:notebooks_notebookfile_changelist')
            + f'?notebook__id__exact={obj.pk}'
        )
        return format_html('<a href="{}">{} file(s)</a>', url, count)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related('user')
            .annotate(file_count=Count('files'))
        )


@admin.register(NotebookFile)
class NotebookFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'notebook_title', 'owner_email', 'file_type', 'ingestion_status', 'uploaded_at')
    list_filter = ('file_type', 'ingestion_status', NotebookOwnerFilter)
    search_fields = ('name', 'notebook__title', 'notebook__user__email', 'notebook__id')
    autocomplete_fields = ('notebook',)
    readonly_fields = ('id', 'uploaded_at', 'updated_at')
    ordering = ('-uploaded_at',)

    @admin.display(description='Notebook', ordering='notebook__title')
    def notebook_title(self, obj):
        url = reverse('admin:notebooks_notebook_change', args=[obj.notebook_id])
        return format_html('<a href="{}">{}</a>', url, obj.notebook.title)

    @admin.display(description='Owner', ordering='notebook__user__email')
    def owner_email(self, obj):
        return obj.notebook.user.email if obj.notebook.user_id else '—'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('notebook', 'notebook__user')
