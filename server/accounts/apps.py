from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = 'accounts'

    def ready(self):
        from . import signals  # noqa: F401
        from .admin_dashboard import install_dashboard
        install_dashboard()
