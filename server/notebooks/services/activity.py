from django.utils import timezone
from notebooks.models import Notebook


def touch_notebook_activity(notebook_id) -> None:
    Notebook.objects.filter(id=notebook_id).update(last_activity_at=timezone.now())