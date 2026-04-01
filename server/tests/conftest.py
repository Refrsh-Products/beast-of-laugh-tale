import pytest
from rest_framework.test import APIClient
from tests.factories import UserFactory


@pytest.fixture
def api_client():
    """
    A plain, unauthenticated DRF test client.
    Use this for endpoints that don't require login (register, login, etc.)
    """
    return APIClient()


@pytest.fixture
def user(db):
    """
    A real User row in the test database.
    The 'db' argument tells pytest-django this fixture needs DB access.
    Default password is "TestPassword123!" (see UserFactory).
    """
    return UserFactory()


@pytest.fixture
def authenticated_client(api_client, user):
    """
    An API client that is already logged in as 'user'.
    Use this for endpoints that require authentication (logout, etc.)
    force_authenticate() bypasses the JWT check — we don't need to go
    through the login flow just to test a different endpoint.
    """
    api_client.force_authenticate(user=user)
    return api_client
