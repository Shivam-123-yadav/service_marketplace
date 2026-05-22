from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from .models import User, VendorProfile
from .serializers import RegisterSerializer, LoginSerializer
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from apps.services.models import Service
from django.db.models import Sum
from apps.bookings.models import Booking





def login_page(request):
    return render(request, "pages/login.html")

def index_page(request):
    return render(request, "index.html")

def register_page(request):
    return render(request, "pages/register.html")


def dashboard_page(request):
    return render(request, "pages/dashboard.html")

def admin_page(request):
    return render(request, "pages/admin-panel.html")

def services_page(request):
    return render(request, "pages/services.html")

def booking_page(request):
    return render(request, "pages/booking.html")

def customer_page(request):
    return render(request, "pages/customer.html")

def customers_page(request):
    return render(request, "pages/customers.html")

def vendor_page(request):
    return render(request, "pages/vendor.html")

def vendor_profile(request):
    return render(request, "pages/vendor_profile.html")

def vendor_analytics(request):
    return render(request, "pages/vendor_analytics.html")



@api_view(['POST'])
def register_view(request):
    
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "message": "User registered successfully",
            "user":{
                "id": user.id,
                "email": user.email,
                "role": user.role
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(["POST"])
def login_view(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(email=email, password=password)

        if user:
            # JWT Generate
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,   # ✅ ADD THIS
                    "role": user.role
                }
            })

        return Response({"error": "Invalid credentials"}, status=401)

    return Response(serializer.errors, status=400)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data['refresh']

        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logout successful"}, status=200)
    except Exception as e:
        return Response({"error": "Invalid token"}, status=400)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def users_list(request):

    users = User.objects.all().order_by("-id")

    data = []

    for u in users:
        data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at
        })

    return Response(data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):

    try:
        user = User.objects.get(id=pk)
        user.delete()

        return Response({
            "message": "User deleted successfully"
        })

    except User.DoesNotExist:
        return Response({
            "error": "User not found"
        }, status=404)
    


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):

    user = request.user

    # ✅ counts
    total_bookings = Booking.objects.count()
    total_services = Service.objects.count()

    # ✅ revenue calculate
    revenue = Booking.objects.filter(
        status="confirmed"
    ).aggregate(total=Sum("total_price"))["total"] or 0

    return Response({
        "bookings": total_bookings,
        "services": total_services,
        "revenue": revenue,   # ✅ IMPORTANT
        "users": User.objects.count(),

        # optional (keep if needed)
        "pending": Booking.objects.filter(
            service__vendor=user,
            status__iexact="pending"
        ).count(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def service_breakdown(request):
    data = Service.objects.values("name").annotate(total=Count("id"))

    return Response(data)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recent_bookings(request):

    bookings = Booking.objects.select_related("service", "customer").order_by("-id")[:5]

    data = []

    for b in bookings:
        data.append({
            "customer": b.customer.name,   # ✅ fix
            "city": "India",
            "service": b.service.name,
            "date": b.created_at.strftime("%d %b %Y"),
            "amount": b.total_price,
            "status": b.status
        })

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_list(request):

    users = User.objects.all().order_by("-id")

    data = []

    for u in users:

        
        bookings = Booking.objects.filter(customer=u)

       
        total_spent = bookings.aggregate(
            total=Sum("total_price")  
        )["total"] or 0

        data.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "city": getattr(u, "city", "N/A"),

           
            "status": "active" if u.is_active else "inactive",

            
            "bookings": bookings.count(),
            "spent": total_spent,

            "joined": u.created_at.strftime("%b %Y")
        })

    return Response(data)




@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_user_status(request, pk):
    try:
        user = User.objects.get(id=pk)

        user.is_active = not user.is_active
        user.save()

        return Response({
            "message": "Status updated",
            "status": user.is_active
        })
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_customer(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save(role="customer")

        return Response({
            "message": "Customer added",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        })
    
    return Response(serializer.errors, status=400)




# Vendor Profile Api Intigretion

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vendor_profiles(request):
    user = request.user
    profile, _ = VendorProfile.objects.get_or_create(user=user)

    return Response({
        "name": user.name,
        "email": user.email,
        "phone": profile.phone or "",
        "city": profile.city or "",
        "experience": profile.experience or "",
        "category": profile.category or "",
        "about": profile.about or ""
    })



# Vendor Update profile Api Intigretion
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_vendor_profile(request):

    user = request.user

    # profile create ho jayega agar exist nahi hai
    profile, created = VendorProfile.objects.get_or_create(user=user)

    user.name = request.data.get("name", user.name)
    user.email = request.data.get("email", user.email)

    profile.phone = request.data.get("phone", profile.phone)
    profile.city = request.data.get("city", profile.city)
    profile.experience = request.data.get("experience", profile.experience)
    profile.category = request.data.get("category", profile.category)
    profile.about = request.data.get("about", profile.about)

    user.save()
    profile.save()

    return Response({
        "message": "Profile updated successfully"
    })






@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vendor_stats(request):

    user = request.user

    total_bookings = Booking.objects.filter(
        service__vendor=user
    ).count()

    completed = Booking.objects.filter(
        service__vendor=user,
        status="completed"
    ).count()
 
    earnings = Booking.objects.filter(
        service__vendor=user,
        status="completed"
    ).aggregate(total=Sum("total_price"))["total"] or 0

    return Response({
        "total_bookings": total_bookings,
        "completed": completed,
        "earnings": earnings,
        "rating": 0
    })

















