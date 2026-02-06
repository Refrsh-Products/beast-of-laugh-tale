from django.contrib import admin
from .models import Notebook
from .models import NotebookFile


class NotebookFileInline(admin.TabularInline):
    model = NotebookFile
    extra = 1
    can_delete = True

    fields = (
            "name", 
            "file", 
            "content", 
            "file_type",
            "updated_at"
            )

    readonly_fields = ("uploaded_at", "updated_at")


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_at")
    inlines = [NotebookFileInline]

@admin.register(NotebookFile)
class NotebookFileAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "notebook", "updated_at")

