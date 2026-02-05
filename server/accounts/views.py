from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader


def accounts(request):
    template = loader.get_template('first_template.html')
    return HttpResponse(template.render())
