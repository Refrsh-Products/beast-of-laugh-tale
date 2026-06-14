from rest_framework import status
from rest_framework.exceptions import APIException


class ErrorCode:
    PAID_ONLY_FEATURE = "paid_only_feature"


class AudioTranscriptionError(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = "audio_transcription_error"

    def __init__(self, detail: str = "Transcription failed. Please try again."):
        super().__init__(
            detail={"code": self.default_code, "message": detail},
            code=self.default_code,
        )


class AudioFileTooLargeError(APIException):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_code = "audio_file_too_large"

    def __init__(self, max_mb: int):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": f"Audio file too large. Maximum size is {max_mb} MB.",
                "max_mb": max_mb,
            },
            code=self.default_code,
        )


class PaidOnlyFeatureError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.PAID_ONLY_FEATURE

    def __init__(self, feature: str = "This feature"):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": f"{feature} is available on the Pro plan. Upgrade to unlock it.",
                "feature": feature,
            },
            code=self.default_code,
        )


class UnsupportedAudioFormatError(APIException):
    status_code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    default_code = "unsupported_audio_format"

    def __init__(self, ext: str):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": f"Unsupported audio format: .{ext}. Supported formats: mp3, mp4, m4a, wav, ogg, flac, aac, webm, 3gp, amr.",
            },
            code=self.default_code,
        )
