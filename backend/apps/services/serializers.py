from rest_framework import serializers
from .models import Service

class ServiceSerializer(serializers.ModelSerializer):
    total_bookings = serializers.IntegerField(read_only=True)
    class Meta:
        model = Service
        fields = "__all__"