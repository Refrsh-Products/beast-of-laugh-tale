from django.contrib import admin
from .models import Notebook
from .models import NotebookFile


class NotebookFileInline(admin.TabularInline):
    model = NotebookFile
    extra = 1


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_at")
    inlines = [NotebookFileInline]

