from django.db import models
from django.conf import settings


class Service(models.Model):

    CATEGORY_CHOICES = (
        ('home', 'Home'),
        ('tech', 'Tech'),
        ('beauty', 'Beauty'),
        ('fitness', 'Fitness'),
        ('creative', 'Creative'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="services"
    )

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.IntegerField()
    description = models.TextField()

    image = models.ImageField(upload_to='services/', null=True, blank=True)

    # ⭐ marketplace fields
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    rating = models.FloatField(default=0)
    reviews = models.IntegerField(default=0)

    time = models.CharField(max_length=50)

    badge = models.CharField(max_length=50, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name