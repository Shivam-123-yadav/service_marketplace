from django.urls import path
from .views import login_view, register_view, register_page, login_page, dashboard_page, index_page, admin_page, services_page, booking_page, customer_page, vendor_page, customers_page, logout_view, users_list
from apps.bookings.views import my_bookings

from . import views
urlpatterns = [
    path('register/',register_view),
    path("login/", login_view),
    path("logout/", logout_view),
    path("login-page/", login_page),
    path("register-page/", register_page),
    path("dashboard-page/", dashboard_page),
    path("index-page/", index_page),
    path("admin-page/", admin_page),
    path("services-page/", services_page),
    path("booking-page/", booking_page),
    path("customer-page/", customer_page),
    path("vendor-page/", vendor_page),
    path("vendor-profile/", views.vendor_profile),
    path("customers-page/", customers_page),
    path("bookings/", my_bookings),
    path("users/", users_list),
    path("users/<int:pk>/", views.delete_user),
    path("stats/", views.dashboard_stats),
    path("service-breakdown/", views.service_breakdown),
    path("recent-bookings/", views.recent_bookings),
    path("customers/", views.customer_list),
    path("toggle-user/<int:pk>/", views.toggle_user_status),
    path("add-customer/", views.add_customer),
    path("vendor-profiles/", views.vendor_profiles),
    path("vendor-analytics/", views.vendor_analytics),
    path("update-vendor-profile/", views.update_vendor_profile),
    path("vendor-stats/", views.vendor_stats),




]