from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from weasyprint import HTML
from weasyprint.text.fonts import FontConfiguration


def generate_booking_pdf(
    booking_id,
    service_name,
    total_price,
    booking_date,
    booking_time,
    customer_name,
    provider_name,
    duration,
    service_category,
    location,
    user_email,
):
    """
    Renders booking_pdf.html Django template → PDF bytes via WeasyPrint.
    """
    context = {
        "booking_id":       booking_id,
        "service_name":     service_name,
        "total_price":      total_price,
        "booking_date":     booking_date,
        "booking_time":     booking_time,
        "customer_name":    customer_name,
        "provider_name":    provider_name,
        "duration":         duration,
        "service_category": service_category,
        "location":         location,
        "user_email":       user_email,
    }

    html_string = render_to_string("booking_pdf.html", context)

    font_config = FontConfiguration()
    pdf_bytes   = HTML(string=html_string).write_pdf(
        font_config=font_config
    )

    return pdf_bytes


@shared_task
def send_booking_confirmation_email(
    user_email,
    service_name,
    total_price,
    booking_date,
    booking_time,
    booking_id,
    customer_name,
    provider_name,
    duration,
    service_category,
    location
):
    # ── 1. HTML email body (banner template) ──────────────────────────────
    html_content = render_to_string("booking_confirmation.html", {
        "user_email":       user_email,
        "service_name":     service_name,
        "total_price":      total_price,
        "booking_date":     booking_date,
        "booking_time":     booking_time,
        "booking_id":       booking_id,
        "customer_name":    customer_name,
        "provider_name":    provider_name,
        "duration":         duration,
        "service_category": service_category,
        "location":         location,
    })

    text_content = strip_tags(html_content)

    email = EmailMultiAlternatives(
        subject    = "Booking Confirmed - ServiceHub",
        body       = text_content,
        from_email = settings.DEFAULT_FROM_EMAIL,
        to         = [user_email],
    )
    email.attach_alternative(html_content, "text/html")

    # ── 2. PDF attachment (HTML → PDF via WeasyPrint) ─────────────────────
    pdf_bytes = generate_booking_pdf(
        booking_id,
        service_name,
        total_price,
        booking_date,
        booking_time,
        customer_name,
        provider_name,
        duration,
        service_category,
        location,
        user_email,
    )
    email.attach(f"booking_{booking_id}.pdf", pdf_bytes, "application/pdf")

    email.send()
    return "Email sent successfully"