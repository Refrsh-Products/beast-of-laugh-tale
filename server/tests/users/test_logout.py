import pytest
from django.urls import reverse
from rest_framework import status

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Using reverse() means the test won't break if the URL path ever changes.
LOGIN_URL = reverse("users:login")
LOGOUT_URL = reverse("users:logout")
REFRESH_URL = reverse("token_refresh")
DEFAULT_PASSWORD = "TestPassword123!"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_logout_success_and_token_refresh_blacklisted(api_client, user):
    """
    Given:  a registered, and authenticated user
    When:   POST /auth/logout/
    Then:   response is 200, refresh token is blacklisted in the backend
    """
    payload = {
        "email": user.email, 
        "password": DEFAULT_PASSWORD,
    }
    login_res = api_client.post(LOGIN_URL, payload)

    assert login_res.status_code == status.HTTP_200_OK, "Login Failed"

    data = login_res.json()
    jwt_access_token = data['tokens']['access']
    jwt_refresh_token = data['tokens']['refresh']

    logout_payload = {"refresh_token": jwt_refresh_token}
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {jwt_access_token}')
    logout_res = api_client.post(LOGOUT_URL, logout_payload)

    assert logout_res.status_code == status.HTTP_200_OK

    api_client.credentials()

    refresh_payload = {"refresh": jwt_refresh_token}
    refresh_response = api_client.post(REFRESH_URL, refresh_payload)

    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED
    assert refresh_response.data['code'] == 'token_not_valid'

# ---------------------------------------------------------------------------
# Failure paths
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_logout_unauthenticated(api_client):
    """
    Given:  a unauthenticated user
    When:   POST /auth/logout/
    Then:   response is 401, users cannot log out without logging in first
    """
    jwt_refresh_token = "FakeRefreshToken"
    logout_payload = {"refresh_token": jwt_refresh_token}
    logout_res = api_client.post(LOGOUT_URL, logout_payload)

    assert logout_res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_logout_missing_refresh_token(authenticated_client, user):
    """
    Given:  a registered, and authenticated user
    When:   POST /auth/logout/
    Then:   response is 400, refresh token is missing from payload
    """
    logout_res = authenticated_client.post(LOGOUT_URL, {})
    assert logout_res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_logout_with_token_refresh_blacklisted(api_client, user):
    """
    Given:  a registered, and authenticated user
    When:   POST /auth/logout/
    Then:   response is 400, trying to logout using blacklisted refresh token
    """
    payload = {
        "email": user.email, 
        "password": DEFAULT_PASSWORD,
    }
    login_res = api_client.post(LOGIN_URL, payload)

    assert login_res.status_code == status.HTTP_200_OK, "Login Failed"

    data = login_res.json()
    jwt_access_token = data['tokens']['access']
    jwt_refresh_token = data['tokens']['refresh']

    logout_payload = {"refresh_token": jwt_refresh_token}
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {jwt_access_token}')
    logout_res = api_client.post(LOGOUT_URL, logout_payload)

    assert logout_res.status_code == status.HTTP_200_OK

    refresh_response = api_client.post(LOGOUT_URL, logout_payload)

    assert refresh_response.status_code == status.HTTP_400_BAD_REQUEST
