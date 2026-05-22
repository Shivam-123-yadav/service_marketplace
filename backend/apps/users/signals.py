from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, VendorProfile


@receiver(post_save, sender=User)
def create_vendor_profile(sender, instance, created, **kwargs):
    if created:
        VendorProfile.objects.create(user=instance)



