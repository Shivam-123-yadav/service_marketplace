from django.urls import path
from . import views

urlpatterns = [
    path("get-services/", views.get_services),
    path("create/", views.create_service),
    path("update/<int:pk>/", views.update_service),
    path("delete/<int:pk>/", views.delete_service),
    path("<int:pk>/approve/", views.approve_service),
    path("<int:pk>/reject/", views.reject_service),

]