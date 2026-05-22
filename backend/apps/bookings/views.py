from django.shortcuts import render

# Create your views here.
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from .models import Booking
from .serializers import BookingSerializer
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from apps.services.models import Service
from decimal import Decimal
from datetime import datetime
from django.db.models import Sum
from django.db.models.functions import ExtractWeekDay
from .tasks import send_booking_confirmation_email

def parse_date(date_str):
    if not date_str:
        return None

    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


@api_view(['GET'])
def booking_list(request):

    bookings = Booking.objects.all().order_by("-id")

    serializer = BookingSerializer(bookings, many=True)

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, id):
    if request.user.role not in ["admin", "vendor"]:
        return Response({"error": "Only admin or vendor can update booking status."}, status=403)

    try:
        booking = Booking.objects.get(id=id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if request.user.role == "vendor" and booking.service.vendor != request.user:
        return Response(
            {"error": "You don't have permission to update this booking"},
            status=403
        )

    status_value = request.data.get("status")
    if not status_value:
        return Response({"error": "status is required"}, status=400)

    allowed_status = {choice[0] for choice in Booking.STATUS_CHOICES}
    if status_value not in allowed_status:
        return Response({"error": f"Invalid status. Allowed values: {', '.join(sorted(allowed_status))}"}, status=400)

    booking.status = status_value
    booking.save()

    return Response({
        "message": "Booking updated",
        "booking": BookingSerializer(booking).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):

    if request.user.role != "customer":
        return Response({"error": "Only customers can create bookings."}, status=403)

    service_id = request.data.get("service")
    booking_date = request.data.get("booking_date")
    booking_time = request.data.get("booking_time")
    address = request.data.get("address")
    note = request.data.get("note", "")

    if not service_id:
        return Response({"error": "service is required"}, status=400)

    if not booking_date:
        return Response({"error": "booking_date is required"}, status=400)

    if not booking_time:
        return Response({"error": "booking_time is required"}, status=400)

    if not address or not str(address).strip():
        return Response({"error": "address is required"}, status=400)

    service = None
    try:
        service = Service.objects.get(id=service_id, status="approved")
    except Service.DoesNotExist:
        return Response({"error": "Service not found or is not approved."}, status=404)

    if service.vendor == request.user:
        return Response({"error": "You cannot book your own service."}, status=403)

    parsed_date = parse_date(booking_date)
    if not parsed_date:
        return Response({"error": "Invalid booking_date format. Use YYYY-MM-DD."}, status=400)

    if len(str(address).strip()) < 10:
        return Response({"error": "Address must be at least 10 characters."}, status=400)

    booking_time = str(booking_time).strip()
    if len(booking_time) < 3:
        return Response({"error": "booking_time must be a valid time string."}, status=400)

    if Booking.objects.filter(
        customer=request.user,
        service=service,
        booking_date=parsed_date,
        booking_time=booking_time
    ).exists():
        return Response({"error": "Booking already exists for the selected date and time."}, status=400)

    booking = Booking.objects.create(
        customer=request.user,
        service=service,
        booking_date=parsed_date,
        booking_time=booking_time,
        address=str(address).strip(),
        note=str(note).strip(),
        total_price=Decimal(service.price)
    )

    booking_code = f"SH-{parsed_date.strftime('%Y%m%d')}-{booking.id:04d}"
    service_category = service.category.title() if service.category else "Service"

    try:
        send_booking_confirmation_email.delay(
            request.user.email,
            service.name,
            f"₹{booking.total_price}",
            parsed_date.strftime("%Y-%m-%d"),
            booking_time,
            booking_code,
            request.user.name,
            service.vendor.name,
            service.time,
            service_category,
            booking.address
        )
    except Exception as err:
        print("Celery task failed, sending confirmation email synchronously:", err)
        try:
            send_booking_confirmation_email.apply(
                args=(
                    request.user.email,
                    service.name,
                    f"₹{booking.total_price}",
                    parsed_date.strftime("%Y-%m-%d"),
                    booking_time,
                    booking_code,
                    request.user.name,
                    service.vendor.name,
                    service.time,
                    service_category,
                    booking.address
                )
            )
        except Exception as email_err:
            print("Fallback email send failed:", email_err)

    return Response(BookingSerializer(booking).data)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):

    user = request.user

   
    if user.role == "admin":
        bookings = Booking.objects.all().order_by("-id")

    
    elif user.role == "vendor":
        bookings = Booking.objects.filter(
            service__vendor=user
        ).order_by("-id")

    
    else:
        bookings = Booking.objects.filter(
            customer=user
        ).order_by("-id")

    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, id):
    try:
        booking = Booking.objects.get(id=id)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found"}, status=404)

    if request.user.role == "customer" and booking.customer != request.user:
        return Response({"error": "You don't have permission to cancel this booking."}, status=403)

    if request.user.role == "vendor":
        return Response({"error": "Vendors cannot cancel bookings."}, status=403)

    if booking.status in ["cancelled", "completed"]:
        return Response({"error": f"Cannot cancel a booking with status '{booking.status}'."}, status=400)

    booking.status = "cancelled"
    booking.save()

    return Response({"message": "Booking cancelled"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_bookings(request):
    if request.user.role != "vendor":
        return Response({"error": "Only vendors can view vendor bookings."}, status=403)

    bookings = Booking.objects.filter(
        service__vendor=request.user
    ).order_by("-id")

    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_pending_bookings(request):
    if request.user.role != "vendor":
        return Response({"error": "Only vendors can view pending vendor bookings."}, status=403)

    bookings = Booking.objects.filter(
        service__vendor=request.user,
        status__iexact="pending"   
    ).order_by("-id")

    serializer = BookingSerializer(bookings, many=True)

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_earnings(request):
    bookings = Booking.objects.filter(
        service__vendor=request.user,
        status="confirmed"
    )

    data = bookings.annotate(
        day=ExtractWeekDay("booking_date")
    ).values("day").annotate(
        total=Sum("total_price")
    )


    days_map = {
        1: "Sun", 2: "Mon", 3:"Tue",
        4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"
    }

    result = []

    for i in range(1,8):
        found = next((d for d in data if d["day"] == i), None)
        result.append({
            "d": days_map[i],
            "v": float(found["total"]) if found else 0
        })

    return Response(result)



from django.db.models import Sum, Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.bookings.models import Booking


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vendor_kpi(request):

    user = request.user

    if user.role != "vendor":
        return Response({"error": "Only vendor allowed"}, status=403)

    # vendor ke services ke bookings
    bookings = Booking.objects.filter(service__vendor=user)

    # 💰 Total Revenue (only completed)
    total_revenue = bookings.filter(status="completed").aggregate(
        total=Sum("total_price")
    )["total"] or 0

    # 📅 Total Bookings
    total_bookings = bookings.count()

    # ✅ Completed bookings
    completed_bookings = bookings.filter(status="completed").count()

    # 📊 Completion rate
    completion_rate = (
        (completed_bookings / total_bookings) * 100
        if total_bookings > 0 else 0
    )

    # 👁️ Profile views (temporary)
    profile_views = 0   # baad me model se laayenge

    return Response({
        "total_revenue": float(total_revenue),
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "completion_rate": round(completion_rate, 2),
        "profile_views": profile_views
    })