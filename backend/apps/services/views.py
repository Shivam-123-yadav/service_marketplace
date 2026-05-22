from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import Service
from .serializers import ServiceSerializer
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from .permissions import IsAdminOrVendor, IsServiceOwnerOrAdmin
from django.db.models import Count

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_services(request):

    if request.user.role == "admin":
        services = Service.objects.all()

    elif request.user.role == "vendor":
        services = Service.objects.filter(vendor=request.user).annotate(
        total_bookings=Count("bookings")   # ✅ name change
        )  

    else:
        services = Service.objects.filter(status="approved")

    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_service(request):
    if request.user.role not in ["vendor", "admin"]:
        return Response({"error": "Only vendors or admins can create services."}, status=403)

    data = request.data.copy()
    data['vendor'] = request.user.id

    serializer = ServiceSerializer(data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_service(request, pk):
    try:
        service = Service.objects.get(id=pk)
    except Service.DoesNotExist:
        return Response({
            "error": "Service not found"},
            status=404
            )
    
    if request.user.role not in ["admin", "vendor"]:
        return Response({"error": "Only admin/vendor can update"}, status=403)
    
    if request.user.role == "vendor" and service.vendor != request.user:
        return Response({"error": "You can update only your services"}, status=403)

    serializer = ServiceSerializer(service, data = request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_service(request, pk):

    try:
        service = Service.objects.get(id=pk)

    except Service.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    
    if request.user.role not in ["admin", "vendor"]:
        return Response({"error": "Not allowed"}, status=403)
    

    if request.user.role == "vendor" and service.vendor != request.user:
        return Response({"error": "You can delet only your services"}, status=403)
    
    service.delete()
    return Response({"message": "Deleted"})
    



@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def approve_service(request, pk):
    if request.user.role != "admin":
        return Response({"error": "Only admin can approve services."}, status=403)

    try:
        service = Service.objects.get(id=pk)
    except Service.DoesNotExist:
        return Response({"error": "Service not found"}, status=404)

    service.status = "approved"
    service.save()

    return Response({"message": "Service approved"})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def reject_service(request, pk):
    if request.user.role != "admin":
        return Response({"error": "Only admin can reject services."}, status=403)

    try:
        service = Service.objects.get(id=pk)
    except Service.DoesNotExist:
        return Response({"error": "Service not found"}, status=404)

    service.status = "rejected"
    service.save()

    return Response({"message": "Service rejected"})