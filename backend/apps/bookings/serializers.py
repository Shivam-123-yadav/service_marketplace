from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    image = serializers.ImageField(source="service.image", read_only=True)  # 👈 SAME NAME

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "service_name",
            "customer",
            "customer_name",
            "booking_date",
            "booking_time",
            "address",
            "total_price",
            "status",
            "image"
        ]