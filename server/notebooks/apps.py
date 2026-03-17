from django.apps import AppConfig


class NotebooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = 'notebooks'

    def ready(self):
        import notebooks.signals  # noqa: F401
