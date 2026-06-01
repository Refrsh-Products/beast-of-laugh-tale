from django.urls import path

from .views import ActivePolicyView

app_name = "policies"

urlpatterns = [
    path("<slug:slug>/", ActivePolicyView.as_view(), name="active-policy"),
]
