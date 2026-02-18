from django.shortcuts import render
from django.template import loader
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class AccountsView(APIView):
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        template = loader.get_template('first_template.html')
        return Response(template.render())
