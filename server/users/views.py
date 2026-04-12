from typing import cast
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
# from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
import requests as http_requests

from users.services import email_service
from .models import User
from accounts.models import Account
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    MessageResponseSerializer,
    RegistrationSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

class GoogleAuth(APIView):
    """
    POST: Authenticate a user via Google OAuth2.
    Accepts a Google ID token, verifies it, and returns JWT tokens.
    Creates a new user account on first sign-in.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        print(f"[GoogleAuth] POST received. request.data: {request.data}")

        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]
        token: str = data['token']

        print(f"[GoogleAuth] Token received (first 20 chars): {token[:20]}...")

        try:
            print("[GoogleAuth] Calling Google userinfo endpoint...")
            userinfo_response = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10,
            )
            print(f"[GoogleAuth] Google userinfo status: {userinfo_response.status_code}")
            print(f"[GoogleAuth] Google userinfo body: {userinfo_response.text}")

            if userinfo_response.status_code != 200:
                print(f"[GoogleAuth] ERROR: Invalid token response from Google")
                return Response({
                    'error': "Invalid token",
                    'status': False
                }, status=status.HTTP_400_BAD_REQUEST)

            client = userinfo_response.json()
            email = client['email']
            print(f"[GoogleAuth] User email from Google: {email}")

            first_name = client.get('given_name', '')
            last_name = client.get('family_name', '')
            profile_picture_url = client.get('picture', '')

            user, created = User.objects.get_or_create(email=email)
            print(f"[GoogleAuth] User {'CREATED' if created else 'FOUND'}: {user.email}")

            if created:
                user.set_unusable_password()
                user.registration_method = 'google'
                user.save()
            else:
                print(f"[GoogleAuth] Existing user registration_method: {user.registration_method}")
                if user.registration_method != 'google':
                    return Response({
                        'error': "User needs to sign in through email",
                        'status': False
                    }, status=status.HTTP_403_FORBIDDEN)

            if profile_picture_url:
                Account.objects.filter(user=user).update(
                    profile_picture_url=profile_picture_url
                )

            refresh = RefreshToken.for_user(user)
            print(f"[GoogleAuth] JWT tokens generated successfully for {user.email}")
            return Response({
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'user': UserSerializer(user).data,
                'new_user': created,
                'profile': {
                    'first_name': first_name,
                    'last_name': last_name,
                    'profile_picture_url': profile_picture_url,
                },
                'status': True
            }, status=status.HTTP_200_OK)
        

        except (KeyError, http_requests.exceptions.RequestException) as e:
            print(f"[GoogleAuth] EXCEPTION: {type(e).__name__}: {e}")
            return Response({
                'error': "Invalid token",
                'status': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
class LoginView(APIView):
    """
    Handles user login and token generation.
    """
    
    @extend_schema(
            request=LoginSerializer,
            responses=UserSerializer
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                request,
                username=serializer.validated_data["email"], # type: ignore
                password=serializer.validated_data["password"], # type: ignore
            )
            if user:
                user = cast(User, user)
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        'user': UserSerializer(user).data,
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    }, status=status.HTTP_200_OK
                )
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LogoutView(APIView):
    """
    Handles user logout and token blacklisting.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if not refresh_token:
                return Response({"error": "refresh_token is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Blacklist the refresh token
            refresh = RefreshToken(refresh_token)
            refresh.blacklist()

            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegistrationView(APIView):
    """
    POST: Register a new user.
    Returns JWT tokens upon successful registration.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegistrationSerializer,
        responses={201: UserSerializer}
    )
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = cast(User, serializer.save())

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class PasswordResetRequestView(APIView):
    """
    POST: Request a password reset email.
    Sends an email with reset link containing uid and token.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: MessageResponseSerializer}
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data: dict = serializer.validated_data  # type: ignore[assignment]
        email: str = data['email']

        try:
            user = User.objects.get(email__iexact=email)
            account = Account.objects.get(user=user)
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(str(user.pk)))

            # Build reset URL (frontend URL)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

            print(f"[PasswordReset] Reset URL: {reset_url}")
            email_service.send_template_email(
                to=email,
                subject='Reset Your FRESHR Password',
                template_name='emails/password_reset.html',
                context={'account': account, 'reset_url': reset_url},
            )

        except (User.DoesNotExist, Account.DoesNotExist):
            # Don't reveal whether email/account exists
            pass

        # Always return success to prevent email enumeration
        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    """
    POST: Confirm password reset with token and set new password.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: MessageResponseSerializer}
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data: dict = serializer.validated_data  # type: ignore[assignment]
        print(data)
        try:
            uid = uuid.UUID(force_str(urlsafe_base64_decode(data['uid'])))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            print(f"[PasswordResetConfirm] UID decode error: {type(e).__name__}: {e} | raw uid={data.get('uid')!r}")
            return Response(
                {'error': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, data['token']):
            return Response(
                {'error': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(data['new_password'])
        user.save()

        return Response({
            'message': 'Password has been reset successfully.'
        }, status=status.HTTP_200_OK)
