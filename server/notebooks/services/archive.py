from django.utils import timezone

from accounts.models import Account
from accounts.services import quota
from notebooks.errors import NotebookArchivedError, NotebookQuotaExceededError
from notebooks.models import Notebook


def assert_notebook_writable(notebook: Notebook) -> None:
    if notebook.is_archived:
        raise NotebookArchivedError(notebook_id=notebook.id)


def archive_notebook(notebook: Notebook) -> Notebook:
    if notebook.is_archived:
        return notebook
    notebook.is_archived = True
    notebook.archived_at = timezone.now()
    notebook.save(update_fields=["is_archived", "archived_at"])
    return notebook


def unarchive_notebook(notebook: Notebook, account: Account) -> Notebook:
    if not notebook.is_archived:
        return notebook
    if not quota.check_notebook_quota(account):
        plan = quota.get_effective_plan(account)
        limits = quota.get_limits(plan)
        active_count = Notebook.objects.filter(
            user=account.user, is_archived=False
        ).count()
        raise NotebookQuotaExceededError(
            active_count=active_count,
            limit=limits["max_notebooks"],
        )
    notebook.is_archived = False
    notebook.archived_at = None
    notebook.save(update_fields=["is_archived", "archived_at"])
    return notebook
