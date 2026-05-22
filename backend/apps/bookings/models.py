from django.db import models

# Create your models here.
from django.conf import settings
from apps.services.models import Service
User = settings.AUTH_USER_MODEL


class Booking(models.Model):

    STATUS_CHOICES = (
        ('pending' , 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bookings"
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="bookings"
    )

    booking_date = models.DateField()
    booking_time = models.CharField(max_length=50)
    address = models.TextField()
    note = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer} - {self.service}"