"""The slide theme picked in the generator must survive the round trip.

The picker sends a `theme` key with the create payload; the viewer and both
exports read it back off the session to colour the deck. If any hop drops the
field the deck silently falls back to the default palette, which is the bug
these tests pin down.
"""

import pytest
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status

from accounts.models import Account
from notebooks.models import Notebook
from presentation.models import Presentation


LIST_CREATE_URL = reverse("presentation:presentation-list-create")


@pytest.fixture
def account(db, user):
    return Account.objects.create(user=user)


@pytest.fixture
def notebook(db, user):
    return Notebook.objects.create(user=user, title="Test Notebook")


@pytest.fixture(autouse=True)
def no_celery():
    """Creation enqueues generation — keep the worker out of these tests."""
    with patch("presentation.views.generate_presentation_task") as task:
        yield task


def create_payload(**overrides):
    payload = {
        "topic": "Photosynthesis",
        "slide_count": 5,
        "text_length": "BALANCED",
    }
    payload.update(overrides)
    return payload


def post_create(client, notebook, **overrides):
    return client.post(
        f"{LIST_CREATE_URL}?notebook={notebook.id}",
        create_payload(**overrides),
        format="json",
    )


# ---------------------------------------------------------------------------
# Round trip
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_persists_chosen_theme_and_returns_it(
    authenticated_client, account, notebook
):
    """
    Given:  the user picked the "dark" theme in the generator
    When:   POST /presentation/?notebook=<id> with theme="dark"
    Then:   202, the stored row and the response both carry "dark"
    """
    response = post_create(authenticated_client, notebook, theme="dark")

    assert response.status_code == status.HTTP_202_ACCEPTED
    assert response.json()["theme"] == "dark"

    presentation = Presentation.objects.get(id=response.json()["id"])
    assert presentation.theme == "dark"


@pytest.mark.django_db
@pytest.mark.parametrize("theme", ["freshr", "minimal", "dark", "academic", "serif"])
def test_every_picker_theme_round_trips_to_the_detail_endpoint(
    authenticated_client, account, notebook, theme
):
    """
    Given:  a deck generated with any of the five themes the picker offers
    When:   the viewer fetches it back via GET /presentation/<id>/
    Then:   the same theme key comes back, so the viewer can resolve a palette
    """
    created = post_create(authenticated_client, notebook, theme=theme)
    assert created.status_code == status.HTTP_202_ACCEPTED

    detail_url = reverse(
        "presentation:presentation-detail",
        kwargs={"presentation_id": created.json()["id"]},
    )
    detail = authenticated_client.get(detail_url)

    assert detail.status_code == status.HTTP_200_OK
    assert detail.json()["theme"] == theme


@pytest.mark.django_db
def test_theme_is_included_in_the_list_payload(
    authenticated_client, account, notebook
):
    """
    Given:  a deck generated with the "serif" theme
    When:   the notebook's presentation list is fetched
    Then:   the list rows carry the theme too — the list is what the notebook
            column renders from before a deck is opened
    """
    post_create(authenticated_client, notebook, theme="serif")

    response = authenticated_client.get(f"{LIST_CREATE_URL}?notebook={notebook.id}")

    assert response.status_code == status.HTTP_200_OK
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["theme"] == "serif"


# ---------------------------------------------------------------------------
# Defaults and validation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_omitted_theme_defaults_to_freshr(authenticated_client, account, notebook):
    """
    Given:  a client that predates the theme field (mobile, or an old tab)
    When:   it creates a presentation without sending `theme`
    Then:   the row still gets a usable key — the default Freshr palette
    """
    response = post_create(authenticated_client, notebook)

    assert response.status_code == status.HTTP_202_ACCEPTED
    assert response.json()["theme"] == "freshr"


@pytest.mark.django_db
def test_unknown_theme_is_rejected(authenticated_client, account, notebook):
    """
    Given:  a theme key that no palette exists for
    When:   POST /presentation/?notebook=<id>
    Then:   400 — better to reject than to persist a key the viewer
            cannot resolve
    """
    response = post_create(authenticated_client, notebook, theme="neon-vaporwave")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "theme" in response.json()
    assert not Presentation.objects.exists()
