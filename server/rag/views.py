from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

from notebooks.models import Notebook
from .services import query_notebook_rag


class QueryInputSerializer(serializers.Serializer):
    notebook_id = serializers.IntegerField()
    user_query = serializers.CharField()


class QueryVectorDBAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=QueryInputSerializer,
        responses={
            200: inline_serializer(
                name="QueryResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "results": serializers.ListField(child=serializers.CharField()),
                },
            ),
            400: inline_serializer(
                name="QueryErrorResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "errors": serializers.DictField(child=serializers.CharField()),
                },
            ),
        },
    )
    def post(self, request):
        raw_notebook_id = request.data.get("notebook_id")
        user_query = request.data.get("user_query")

        if not raw_notebook_id or not user_query:
            return Response(
                {
                    "success": False,
                    "errors": {"detail": "notebook_id and user_query are required."},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            notebook_id = int(raw_notebook_id)
        except (TypeError, ValueError):
            return Response(
                {"success": False, "errors": {"detail": "notebook_id must be an integer."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        get_object_or_404(Notebook, id=notebook_id, user=request.user)

        try:
            context_docs = async_to_sync(query_notebook_rag)(
                notebook_id, request.user.pk, user_query
            )
        except Exception as e:
            return Response(
                {"success": False, "errors": {"detail": str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        results_data = [doc.page_content for doc in context_docs]

        return Response(
            {"success": True, "results": results_data},
            status=status.HTTP_200_OK,
        )
