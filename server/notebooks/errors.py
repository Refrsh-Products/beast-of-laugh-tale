from rest_framework import status
from rest_framework.exceptions import APIException


class ErrorCode:
    NOTEBOOK_ARCHIVED = "notebook_archived"
    NOTEBOOK_QUOTA_EXCEEDED = "notebook_quota_exceeded"
    FILE_QUOTA_EXCEEDED = "file_quota_exceeded"
    FILE_SIZE_EXCEEDED = "file_size_exceeded"
    STORAGE_QUOTA_EXCEEDED = "storage_quota_exceeded"
    DAILY_QUIZ_QUOTA_EXCEEDED = "daily_quiz_quota_exceeded"
    PRESENTATION_QUOTA_EXCEEDED = "presentation_quota_exceeded"


class NotebookArchivedError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.NOTEBOOK_ARCHIVED

    def __init__(self, notebook_id):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "This notebook is archived. Unarchive it to make changes.",
                "notebook_id": str(notebook_id),
            },
            code=self.default_code,
        )


class NotebookQuotaExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.NOTEBOOK_QUOTA_EXCEEDED

    def __init__(self, active_count: int, limit):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "You have reached your active notebook limit.",
                "active_count": active_count,
                "limit": limit,
            },
            code=self.default_code,
        )


class FileQuotaExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.FILE_QUOTA_EXCEEDED

    def __init__(self, limit):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "You have reached the file limit for this notebook.",
                "limit": limit,
            },
            code=self.default_code,
        )


class FileSizeExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.FILE_SIZE_EXCEEDED

    def __init__(self, max_mb: int):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": f"File size exceeded. Maximum file size is {max_mb}MB.",
                "max_mb": max_mb,
            },
            code=self.default_code,
        )


class StorageQuotaExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.STORAGE_QUOTA_EXCEEDED

    def __init__(self, limit_bytes: int):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "You have reached your storage limit.",
                "limit_bytes": limit_bytes,
            },
            code=self.default_code,
        )


class DailyQuizQuotaExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.DAILY_QUIZ_QUOTA_EXCEEDED

    def __init__(self, limit: int):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "You have reached your daily quiz limit.",
                "limit": limit,
            },
            code=self.default_code,
        )


class PresentationQuotaExceededError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = ErrorCode.PRESENTATION_QUOTA_EXCEEDED

    def __init__(self, limit):
        super().__init__(
            detail={
                "code": self.default_code,
                "message": "You have reached your presentation limit.",
                "limit": limit,
            },
            code=self.default_code,
        )
