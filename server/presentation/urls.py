from django.urls import path

from . import views

urlpatterns = [
    path("", views.PresentationListCreateView.as_view(), name="presentation-list-create"),
    path("favourites/", views.PresentationFavouritesView.as_view(), name="presentation-favourites"),
    path("<uuid:presentation_id>/", views.PresentationDetailView.as_view(), name="presentation-detail"),
    path(
        "<uuid:presentation_id>/slides/<uuid:slide_id>/",
        views.SlideUpdateView.as_view(),
        name="presentation-slide-update",
    ),
    path(
        "<uuid:presentation_id>/slides/<uuid:slide_id>/refine/",
        views.SlideRefineView.as_view(),
        name="presentation-slide-refine",
    ),
]
