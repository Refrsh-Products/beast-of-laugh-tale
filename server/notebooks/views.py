import logging

from django.db import transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from notebooks.services.activity import touch_notebook_activity
from notebooks.services.archive import (
    archive_notebook,
    assert_notebook_writable,
    unarchive_notebook,
)
from .errors import (
    FileQuotaExceededError,
    FileSizeExceededError,
    NotebookQuotaExceededError,
    StorageQuotaExceededError,
)
from .models import Notebook, NotebookFile
from accounts.models import Account
from accounts.services import quota
from .serializers import NotebookSerializer, NotebookFileSerializer, NotebookFileInputSerializer, NotebookFileCreateSuccessSerializer, NotebookFileCreateErrorSerializer

from django.shortcuts import get_object_or_404
from .services.notebook_file import NotebookFileService
from drf_spectacular.utils import extend_schema
from rag.tasks import ingest_note_task
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)


class NotebookDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotebookSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self): # type: ignore
        return get_object_or_404(Notebook, pk=self.kwargs["pk"], user=self.request.user)

    def perform_update(self, serializer):
        assert_notebook_writable(serializer.instance)
        super().perform_update(serializer)
        notebook_id = serializer.instance.id
        touch_notebook_activity(notebook_id)
        logger.info("Notebook %s updated by user %s", notebook_id, self.request.user.pk)

class NotebookListAPIView(generics.ListCreateAPIView):
    queryset = Notebook.objects.none()
    serializer_class = NotebookSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self): # type: ignore
        queryset = Notebook.objects.filter(user=self.request.user)
        archived_param = self.request.query_params.get('archived', 'false').lower() # type: ignore
        if archived_param == "true":
            return queryset.filter(is_archived=True)
        return queryset.filter(is_archived=False)

    def perform_create(self, serializer):
        with transaction.atomic():
            account = Account.objects.select_for_update().get(user=self.request.user)
            if not quota.check_notebook_create_quota(account):
                _, limit = quota.get_notebook_quota_counts(account)
                total_count = quota.get_notebook_total_count(account)
                logger.warning(
                    "Notebook quota exceeded for user %s: %d/%s notebooks",
                    self.request.user.pk, total_count, limit,
                )
                raise NotebookQuotaExceededError(active_count=total_count, limit=limit)
            serializer.save(user=self.request.user)
            logger.info("Notebook created for user %s", self.request.user.pk)

class NotebookArchiveAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotebookSerializer

    def post(self, request, pk):
        notebook = get_object_or_404(Notebook, pk=pk, user=request.user)
        archive_notebook(notebook)
        logger.info("Notebook %s archived by user %s", pk, request.user.pk)
        return Response(NotebookSerializer(notebook).data, status=status.HTTP_200_OK)


class NotebookUnarchiveAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotebookSerializer

    def post(self, request, pk):
        with transaction.atomic():
            account = Account.objects.select_for_update().get(user=request.user)
            notebook = get_object_or_404(Notebook, pk=pk, user=request.user)
            unarchive_notebook(notebook, account)
        logger.info("Notebook %s unarchived by user %s", pk, request.user.pk)
        return Response(NotebookSerializer(notebook).data, status=status.HTTP_200_OK)

class NotebookFileCreateAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    @extend_schema(
        request={
            'multipart/form-data': NotebookFileInputSerializer
        },
        responses={
            201: NotebookFileCreateSuccessSerializer,
            400: NotebookFileCreateErrorSerializer
        }
    )
    def post(self, request, notebook_id):
        notebook = get_object_or_404(Notebook, id=notebook_id, user=request.user)
        assert_notebook_writable(notebook)
        serializer = NotebookFileInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                    {
                        "success" : False,
                        "errors" : serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        uploaded_file = serializer.validated_data["file"] # type: ignore

        with transaction.atomic():
            account = Account.objects.select_for_update().get(user=self.request.user)
            if not quota.check_file_per_notebook_quota(account, notebook):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                logger.warning(
                    "File quota exceeded for notebook %s (user %s)",
                    notebook_id, request.user.pk,
                )
                raise FileQuotaExceededError(limit=limits["max_files_per_notebook"])
            if not quota.check_size_per_file(account, uploaded_file.size):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                logger.warning(
                    "File size %d bytes exceeds limit for user %s",
                    uploaded_file.size, request.user.pk,
                )
                raise FileSizeExceededError(max_mb=limits["max_size_per_file_mega_bytes"])
            if not quota.check_storage_quota(account, uploaded_file.size):
                plan = quota.get_effective_plan(account)
                limits = quota.get_limits(plan)
                logger.warning(
                    "Storage quota exceeded for user %s: used=%d incoming=%d",
                    request.user.pk, account.storage_bytes_used, uploaded_file.size,
                )
                raise StorageQuotaExceededError(limit_bytes=limits["storage_mega_bytes"] * 1024 * 1024)

            notebook_file = NotebookFileService.add_notebook_file(
                    notebook=notebook,
                    uploaded_file=uploaded_file,
                    file_size=uploaded_file.size,
                    )
            account.storage_bytes_used += uploaded_file.size
            account.save()
            touch_notebook_activity(notebook_id=notebook.id)
            
        if notebook_file:
            ingest_note_task.delay(notebook_file.pk)  # type: ignore[attr-defined]
            logger.info(
                "File %s uploaded to notebook %s by user %s (%d bytes)",
                notebook_file.pk, notebook_id, request.user.pk, uploaded_file.size,
            )
            response = Response(
                    {
                        "success": True,
                        "errors": [],
                        "id": str(notebook_file.pk),
                        "ingestion_status": notebook_file.ingestion_status,
                    },
                    status=status.HTTP_201_CREATED
                    )
        else:
            response = Response(
                    {"success": False, "errors": []},
                    status=status.HTTP_400_BAD_REQUEST
                    )

        return response
    
class NotebookFileListAPIView(generics.ListAPIView):
    queryset = NotebookFile.objects.none()
    serializer_class = NotebookFileSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self): # type: ignore
        notebook = get_object_or_404(Notebook, id=self.kwargs["notebook_id"], user=self.request.user)
        return NotebookFile.objects.filter(notebook=notebook)

class NotebookFileDeleteAPIView(generics.DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotebookFileSerializer

    def get_queryset(self): # type: ignore
        notebook_id = self.kwargs.get('notebook_id')
        return NotebookFile.objects.filter(
            notebook__user=self.request.user,
            notebook_id=notebook_id
        ).select_related("notebook")

    def perform_destroy(self, instance):
        assert_notebook_writable(instance.notebook)
        notebook_id = instance.notebook_id
        file_id = instance.pk
        super().perform_destroy(instance)
        touch_notebook_activity(notebook_id)
        logger.info("File %s deleted from notebook %s by user %s", file_id, notebook_id, self.request.user.pk)
