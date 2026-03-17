from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from asgiref.sync import async_to_sync
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

from notebooks.models import Notebook
from .serializers import QueryInputSerializer
from .services import query_notebook_rag


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
        serializer = QueryInputSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        notebook_id = serializer.validated_data["notebook_id"] # type: ignore
        user_query = serializer.validated_data["user_query"] # type: ignore
        
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
