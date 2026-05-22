from django.urls import path

from . import views
urlpatterns = [
    path("bookings/", views.booking_list),
    path("booking/update/<int:id>/", views.update_booking_status),
    path("create/", views.create_booking),
    path("my/", views.my_bookings),
    path("vendor/", views.vendor_bookings),
    path("cancel/<int:id>/", views.cancel_booking),
    path("pending/", views.vendor_pending_bookings),
    path("weekly-earnings/", views.weekly_earnings),
    path("kpi/", views.vendor_kpi),

]