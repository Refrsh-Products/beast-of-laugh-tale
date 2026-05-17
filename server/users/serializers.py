from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only user serializer for responses"""
    class Meta:
        model = User
        fields = ['id', 'email', 'is_active', 'created_at']
        read_only_fields = fields


class RegistrationSerializer(serializers.Serializer):
    """Registration serializer. Duplicate-email handling lives in the view so that
    an existing-but-unverified account triggers a silent resend instead of an error."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        ) # type: ignore
        return user
    
class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login requests.

    Fields:
        - email: The user's email address (required).
        - password: The user's password (write-only, required).
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class GoogleAuthSerializer(serializers.Serializer):
    """Google OAuth2 token from the client (ID token)"""
    token = serializers.CharField()


class MessageResponseSerializer(serializers.Serializer):
    """Generic message response"""
    message = serializers.CharField()


class EmailVerificationRequestSerializer(serializers.Serializer):
    """(Re)send the email verification link for an unverified account"""
    email = serializers.EmailField()


class EmailVerificationConfirmSerializer(serializers.Serializer):
    """Confirm email verification with the uid+token from the verification link"""
    uid = serializers.CharField()
    token = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request password reset via email"""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token"""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        return attrs
