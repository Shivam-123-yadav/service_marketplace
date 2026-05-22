from rest_framework.permissions import BasePermission


class IsAdminOrVendor(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["admin", "vendor"]
        )


class IsServiceOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):

        if request.user.role == "admin":
            return True
        
        if request.user.role == "vendor" and obj.vendor == request.user:
            return True
        return False