from typing import cast
import uuid
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
import requests as http_requests

from users.services import email_service
from users.services.email_normalization import normalize_email
from users.services.verification import send_verification_email
from users.services.welcome import send_welcome_email
from users.services.promotional_email import send_promotional_email
from users.services.unsubscribe import unsubscribe_by_token
from users.tokens import email_verification_token
from .models import User
from accounts.models import Account
from accounts.services.account import ensure_account
from .serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    MessageResponseSerializer,
    RegistrationSerializer,
    UserSerializer,
    EmailVerificationRequestSerializer,
    EmailVerificationConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PromotionalEmailSendSerializer,
    PromotionalEmailSendResponseSerializer,
    UnsubscribeSerializer,
)

logger = logging.getLogger(__name__)

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
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]
        token: str = data['token']

        try:
            logger.debug("[GoogleAuth] Calling Google userinfo endpoint...")
            userinfo_response = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10,
            )
            logger.debug(f"[GoogleAuth] Google userinfo status: {userinfo_response.status_code}")

            if userinfo_response.status_code != 200:
                logger.error(f"[GoogleAuth] ERROR: Invalid token response from Google")
                return Response({
                    'error': "Invalid token",
                    'status': False
                }, status=status.HTTP_400_BAD_REQUEST)

            client = userinfo_response.json()
            email = client['email']

            first_name = client.get('given_name', '')
            last_name = client.get('family_name', '')
            profile_picture_url = client.get('picture', '')

            # Look up by normalized_email (not the raw email) so a Google account whose
            # address is a dotted/+tag alias of an existing email/password account's
            # inbox (e.g. Gmail's "john.doe@" == "johndoe@") is recognized as
            # the same user rather than silently creating a second free-tier account.
            user = User.objects.filter(normalized_email=normalize_email(email)).first()
            created = user is None
            if created:
                user = User.objects.create(email=email)
            logger.debug(f"[GoogleAuth] User {'CREATED' if created else 'FOUND'}: {user.email}")

            if created:
                user.set_unusable_password()
                user.registration_method = 'google'
                # Google has already verified the email, so skip our verification step.
                user.is_active = True
                user.save()
                send_welcome_email(user)
            else:
                logger.debug(f"[GoogleAuth] Existing user registration_method: {user.registration_method}")
                if user.registration_method != 'google':
                    return Response({
                        'error': (
                            "This email already has a password-based account. "
                            "Please log in with your email and password instead of Google."
                        ),
                        'status': False
                    }, status=status.HTTP_403_FORBIDDEN)

            # Every authenticated user must have an Account row so views that
            # touch request.user.account don't crash. For brand-new Google users
            # we seed name/picture from Google; for returning users this is a
            # no-op unless their Account was somehow missing.
            ensure_account(
                user,
                first_name=first_name or None,
                last_name=last_name or None,
                profile_picture_url=profile_picture_url or None,
            )
            if profile_picture_url:
                # Refresh the picture for returning users in case it changed at
                # the provider. ensure_account already filled it for new users.
                Account.objects.filter(user=user).update(
                    profile_picture_url=profile_picture_url
                )

            refresh = RefreshToken.for_user(user)
            logger.debug(f"[GoogleAuth] JWT tokens generated successfully.")
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
            logger.error(f"[GoogleAuth] EXCEPTION: {type(e).__name__}: {e}")
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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]  # type: ignore
        password = serializer.validated_data["password"]  # type: ignore

        user = authenticate(request, username=email, password=password)
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

        # authenticate() returns None for both wrong-password and inactive users.
        # If credentials are correct but the account is unverified, surface that
        # explicitly so the frontend can offer a "resend verification" action.
        existing = User.objects.filter(email__iexact=email).first()
        if existing and not existing.is_active and existing.check_password(password):
            return Response(
                {"error": "Please verify your email before logging in.", "needs_verification": True},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    
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
    The user is created with is_active=False and emailed a verification link.
    JWT tokens are not returned here — they are issued by the verification-confirm
    endpoint once the user proves ownership of the email.

    If a user with this email already exists:
      - and is verified → 400 with an "already exists" error.
      - and is unverified → password is overwritten with the new submission and the
        verification email is resent. This recovers the "lost the verification link"
        case without leaking that the email is registered.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=RegistrationSerializer,
        responses={201: MessageResponseSerializer}
    )
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]
        email: str = data['email']
        password: str = data['password']

        # Matched on normalized_email (not raw email) so alias variants of an
        # already-registered inbox (Gmail dots, +tags) can't be used to spin up
        # extra free-tier accounts. See users/services/email_normalization.py.
        existing = User.objects.filter(normalized_email=normalize_email(email)).first()
        if existing and existing.is_active:
            return Response(
                {'error': 'An account with this email already exists. Please log in or reset your password.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if existing:
            existing.set_password(password)
            existing.save(update_fields=['password'])
            user = existing
        else:
            user = cast(User, serializer.save())

        send_verification_email(user)

        return Response(
            {'message': 'Account created. Check your email to verify your account.'},
            status=status.HTTP_201_CREATED,
        )

class EmailVerificationRequestView(APIView):
    """
    POST: (Re)send the email-verification link.
    Always responds with a generic success message regardless of whether the email
    is registered, to avoid leaking which addresses have accounts.

    Rate-limited via DEFAULT_THROTTLE_RATES['verify_email_resend'] to prevent
    abuse of the outbound email channel.
    """
    permission_classes = [AllowAny]
    throttle_scope = 'verify_email_resend'

    @extend_schema(
        request=EmailVerificationRequestSerializer,
        responses={200: MessageResponseSerializer},
    )
    def post(self, request):
        serializer = EmailVerificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]
        email: str = data['email']

        user = User.objects.filter(email__iexact=email, is_active=False).first()
        if user:
            send_verification_email(user)

        return Response(
            {'message': 'If an unverified account exists for this email, a verification link has been sent.'},
            status=status.HTTP_200_OK,
        )


class EmailVerificationConfirmView(APIView):
    """
    POST: Confirm email verification with uid+token.
    Activates the account (is_active=True) and returns JWT tokens so the user
    can proceed straight to onboarding without a second login step.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=EmailVerificationConfirmSerializer,
        responses={200: UserSerializer},
    )
    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]

        try:
            uid = uuid.UUID(force_str(urlsafe_base64_decode(data['uid'])))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            logger.error(f"[EmailVerificationConfirm] UID decode error: {type(e).__name__}: {e} | raw uid={data.get('uid')!r}")
            return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        # Friendly message for already-verified users; otherwise the is_active hash
        # in the token would make the link look "expired" which is confusing.
        if user.is_active:
            return Response(
                {'error': 'This account is already verified. Please log in.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not email_verification_token.check_token(user, data['token']):
            return Response(
                {'error': 'Invalid or expired verification link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.save(update_fields=['is_active'])

        # Create the stub Account now so every verified user is safe to assume
        # request.user.account exists. The onboarding form then PATCHes this
        # row and flips onboarding_completed to True.
        ensure_account(user)

        # Welcome the user now that they've proved ownership of the address —
        # sending it at registration would email inboxes that may never verify.
        # Kept last and guarded: a mail-provider hiccup must not undo the
        # verification/account work above or 500 the request. Worst case the
        # user just doesn't get a welcome email.
        try:
            send_welcome_email(user)
        except Exception:
            logger.exception("Welcome email failed for user %s; verification still succeeded", user.pk)

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)


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
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(str(user.pk)))

            # Build reset URL (frontend URL)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

            if settings.DEBUG:
                logger.info(f"[PasswordReset] Reset URL: {reset_url}")

            email_service.send_template_email(
                to=email,
                subject='Reset your password',
                template_name='emails/password_reset.html',
                context={'reset_url': reset_url},
                from_email=settings.PASSWORD_RESET_FROM_EMAIL,
            )

        except User.DoesNotExist:
            # Don't reveal whether the email exists
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

        try:
            uid = uuid.UUID(force_str(urlsafe_base64_decode(data['uid'])))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist) as e:
            logger.error(f"[PasswordResetConfirm] UID decode error: {type(e).__name__}: {e} | raw uid={data.get('uid')!r}")
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


class PromotionalEmailSendView(APIView):
    """
    POST: Send a promotional campaign email (emails/promotional.html) to an
    explicit list of recipients. Staff-only — this is a manually-initiated
    marketing send, never triggered automatically by any app event.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        request=PromotionalEmailSendSerializer,
        responses={200: PromotionalEmailSendResponseSerializer},
    )
    def post(self, request):
        serializer = PromotionalEmailSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]

        sent, failed, skipped = send_promotional_email(
            recipients=data['recipients'],
            subject=data['subject'],
            context={
                'eyebrow': data.get('eyebrow', ''),
                'heading': data['heading'],
                'body': data['body'],
                'cta_text': data.get('cta_text') or 'Learn more',
                'cta_url': data.get('cta_url', ''),
                'offer_eyebrow': data.get('offer_eyebrow', ''),
                'offer_body': data.get('offer_body', ''),
                'offer_cta_text': data.get('offer_cta_text') or 'Claim your discount',
                'offer_cta_url': data.get('offer_cta_url', ''),
            },
        )

        return Response(
            {'sent': sent, 'failed': failed, 'skipped': skipped},
            status=status.HTTP_200_OK,
        )


class UnsubscribeView(APIView):
    """
    POST: Opt an email address out of marketing/promotional email using the
    signed token from an email footer link. AllowAny — the token is the
    credential. Idempotent; only an invalid/tampered token returns 400.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=UnsubscribeSerializer,
        responses={200: MessageResponseSerializer},
    )
    def post(self, request):
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data  # type: ignore[assignment]

        if not unsubscribe_by_token(data['token']):
            return Response(
                {'error': 'This unsubscribe link is invalid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'message': 'You have been unsubscribed from marketing emails.'},
            status=status.HTTP_200_OK,
        )


class UnsubscribeOneClickView(APIView):
    """
    POST /unsubscribe/one-click/<token>/: RFC 8058 one-click endpoint referenced
    by the List-Unsubscribe / List-Unsubscribe-Post headers on promotional email.
    Mail providers POST here (no body, no cookies) when the recipient taps the
    native "Unsubscribe" affordance. authentication_classes is emptied so DRF's
    SessionAuthentication CSRF check never applies to this cross-origin POST.
    """
    permission_classes = [AllowAny]
    authentication_classes: list = []

    @extend_schema(request=None, responses={200: None})
    def post(self, request, token):
        # Always 200 — the provider only needs a success signal, and we never
        # want to leak whether the token mapped to a real user.
        unsubscribe_by_token(token)
        return Response(status=status.HTTP_200_OK)
