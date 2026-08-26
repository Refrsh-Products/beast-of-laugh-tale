from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework import status

from notebooks.models import Notebook, NotebookFile
from tests.factories import AccountFactory, NotebookFactory


NOTEBOOK_LIST_URL = reverse("notebooks:list-notebooks")


def notebook_detail_url(notebook):
    return reverse("notebooks:notebook", kwargs={"pk": notebook.pk})


# Verifies that NotebookListAPIView creates a notebook for the authenticated user.
@pytest.mark.django_db
def test_create_notebook_assigns_authenticated_user(
    authenticated_client,
    user,
):
    AccountFactory(user=user)

    response = authenticated_client.post(
        NOTEBOOK_LIST_URL,
        {"title": "Biology Notes"},
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED

    notebook = Notebook.objects.get(title="Biology Notes")
    assert notebook.user == user
    assert response.data["title"] == "Biology Notes"


# Verifies that the current notebook quota prevents creation beyond the plan limit.
@pytest.mark.django_db
def test_create_notebook_rejected_at_quota(
    authenticated_client,
    user,
    settings,
):
    AccountFactory(user=user)
    free_limit = settings.FRESHR_TIER_LIMITS["FREE"]["max_notebooks"]
    assert isinstance(free_limit, int)
    NotebookFactory.create_batch(free_limit, user=user)

    response = authenticated_client.post(
        NOTEBOOK_LIST_URL,
        {"title": "One Notebook Too Many"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["code"] == "notebook_quota_exceeded"
    assert Notebook.objects.filter(user=user).count() == free_limit
    assert not Notebook.objects.filter(title="One Notebook Too Many").exists()


# Verifies that NotebookListAPIView never exposes another user's notebooks.
@pytest.mark.django_db
def test_list_returns_only_authenticated_users_notebooks(
    authenticated_client,
    user,
):
    own_notebook = NotebookFactory(user=user)
    other_notebook = NotebookFactory()

    response = authenticated_client.get(NOTEBOOK_LIST_URL)

    assert response.status_code == status.HTTP_200_OK
    returned_ids = {str(notebook["id"]) for notebook in response.data}
    assert str(own_notebook.id) in returned_ids
    assert str(other_notebook.id) not in returned_ids


# Verifies that the archived query parameter separates active and archived notebooks.
@pytest.mark.django_db
def test_list_separates_active_and_archived_notebooks(
    authenticated_client,
    user,
):
    active_notebook = NotebookFactory(user=user, is_archived=False)
    archived_notebook = NotebookFactory(user=user, is_archived=True)

    active_response = authenticated_client.get(NOTEBOOK_LIST_URL)
    archived_response = authenticated_client.get(
        NOTEBOOK_LIST_URL,
        {"archived": "true"},
    )

    assert active_response.status_code == status.HTTP_200_OK
    assert archived_response.status_code == status.HTTP_200_OK
    active_ids = {str(notebook["id"]) for notebook in active_response.data}
    archived_ids = {
        str(notebook["id"]) for notebook in archived_response.data
    }
    assert active_ids == {str(active_notebook.id)}
    assert archived_ids == {str(archived_notebook.id)}


# Verifies that NotebookDetailAPIView persists title and pinned-state updates.
@pytest.mark.django_db
def test_update_renames_and_pins_notebook(authenticated_client, user):
    notebook = NotebookFactory(user=user, title="Old Title", pinned=False)

    response = authenticated_client.patch(
        notebook_detail_url(notebook),
        {"title": "New Title", "pinned": True},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    notebook.refresh_from_db()
    assert notebook.title == "New Title"
    assert notebook.pinned is True


# Verifies the detail view's ownership check for read, update, and delete requests.
@pytest.mark.django_db
def test_user_cannot_access_another_users_notebook(
    authenticated_client,
):
    other_notebook = NotebookFactory(title="Private Notebook")
    url = notebook_detail_url(other_notebook)

    get_response = authenticated_client.get(url)
    patch_response = authenticated_client.patch(
        url,
        {"title": "Stolen Title"},
        format="json",
    )
    delete_response = authenticated_client.delete(url)

    assert get_response.status_code == status.HTTP_404_NOT_FOUND
    assert patch_response.status_code == status.HTTP_404_NOT_FOUND
    assert delete_response.status_code == status.HTTP_404_NOT_FOUND
    other_notebook.refresh_from_db()
    assert other_notebook.title == "Private Notebook"


# Verifies that deleting a notebook cascades to all attached NotebookFile rows.
@pytest.mark.django_db
def test_delete_notebook_cascades_to_attached_files(
    authenticated_client,
    user,
):
    notebook = NotebookFactory(user=user)
    notebook_file = NotebookFile.objects.create(
        notebook=notebook,
        name="Lecture notes",
        file="notebooks/lecture.pdf",
        file_type="pdf",
    )

    with patch("rag.tasks.delete_notebook_vectors_task.delay"):
        response = authenticated_client.delete(notebook_detail_url(notebook))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Notebook.objects.filter(pk=notebook.pk).exists()
    assert not NotebookFile.objects.filter(pk=notebook_file.pk).exists()


# Verifies that the post-delete signal queues PGVector cleanup with the notebook ID.
@pytest.mark.django_db
def test_delete_notebook_queues_vector_cleanup(
    authenticated_client,
    user,
):
    notebook = NotebookFactory(user=user)
    notebook_id = str(notebook.pk)

    with patch("rag.tasks.delete_notebook_vectors_task.delay") as mock_delay:
        response = authenticated_client.delete(notebook_detail_url(notebook))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    mock_delay.assert_called_once_with(notebook_id)


# Documents that a synchronous Celery enqueue failure rolls back notebook deletion.
@pytest.mark.django_db(transaction=True)
def test_delete_notebook_rolls_back_when_cleanup_cannot_be_queued(
    authenticated_client,
    user,
):
    notebook = NotebookFactory(user=user)

    with patch(
        "rag.tasks.delete_notebook_vectors_task.delay",
        side_effect=RuntimeError("Redis unavailable"),
    ):
        with pytest.raises(RuntimeError, match="Redis unavailable"):
            authenticated_client.delete(notebook_detail_url(notebook))

    assert Notebook.objects.filter(pk=notebook.pk).exists()


# Verifies that every notebook CRUD operation requires an authenticated user.
@pytest.mark.django_db
def test_notebook_crud_requires_authentication(api_client):
    notebook = NotebookFactory()
    detail_url = notebook_detail_url(notebook)

    responses = [
        api_client.get(NOTEBOOK_LIST_URL),
        api_client.post(
            NOTEBOOK_LIST_URL,
            {"title": "Unauthorized Notebook"},
            format="json",
        ),
        api_client.get(detail_url),
        api_client.patch(
            detail_url,
            {"title": "Unauthorized Rename"},
            format="json",
        ),
        api_client.delete(detail_url),
    ]

    assert all(
        response.status_code == status.HTTP_401_UNAUTHORIZED
        for response in responses
    )
