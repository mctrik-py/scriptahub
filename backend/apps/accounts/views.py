import random
import string
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum
from .serializers import RegisterSerializer, UserSerializer
from .models import Notification, WriterProfile, PlatformSettings

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except Exception:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        requested_role = self.context['request'].data.get('role')
        actual_role = "admin" if (self.user.is_superuser or self.user.role == "admin") else self.user.role

        if requested_role and requested_role != actual_role:
            raise serializers.ValidationError({"detail": f"Wrong role. You are registered as a {actual_role}."})

        if actual_role == "mentor":
            try:
                profile = self.user.writer_profile
                if profile.is_rejected:
                    raise serializers.ValidationError({"detail": "Your account application was rejected."})
            except WriterProfile.DoesNotExist:
                WriterProfile.objects.create(user=self.user, verified=True, specialization="General")
                
        refresh = RefreshToken.for_user(self.user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": actual_role,
        }

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        if request.content_type == 'multipart/form-data' or 'multipart/form-data' in request.content_type:
            data = request.data
        else:
            data = request.data.copy()
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.save()
            user.last_active = timezone.now()
            user.email_verified = True
            user.save()
            
            if user.role == "mentor":
                if user.email.endswith("@scriptahub.com"):
                    WriterProfile.objects.filter(user=user).update(verified=True, is_rejected=False)

            return Response({
                "user": UserSerializer(user).data,
                "tokens": get_tokens_for_user(user)
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        data = UserSerializer(user).data
        
        data["is_verified_mentor"] = False
        if user.role == "mentor":
            try:
                data["is_verified_mentor"] = user.writer_profile.verified
            except:
                pass
        
        return Response(data)

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if "username" in request.data: user.username = request.data["username"]
        if "email" in request.data: user.email = request.data["email"]
        if "password" in request.data and request.data["password"]:
            user.set_password(request.data["password"])
        user.save()
        return Response(UserSerializer(user).data)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        if user.verification_code == code:
            user.email_verified = True
            user.verification_code = None
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({"status": "verified", "role": user.role, "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)}})
        return Response({"error": "Invalid code"}, status=400)

class ConfirmEmailChangeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        code = request.data.get("code")
        user = request.user
        if not user.pending_email: return Response({"error": "No pending email change."}, status=400)
        if user.verification_code == code:
            user.email = user.pending_email
            user.pending_email = None
            user.verification_code = None
            user.save()
            return Response({"status": "verified", "email": user.email})
        return Response({"error": "Invalid code"}, status=400)

class ConfirmLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        if user.verification_code == code:
            user.verification_code = None
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({"status": "verified", "role": user.role, "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)}})
        return Response({"error": "Invalid code"}, status=400)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "is_read", "created_at"]

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return self.request.user.notifications.order_by("-created_at")

class MarkNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({"status": "success"})

# --- PASSWORD RESET VIEWS ---
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        try:
            user = User.objects.get(email=email)
            # Generate a 6-digit code
            code = ''.join(random.choices(string.digits, k=6))
            user.verification_code = code
            user.save()

            send_mail(
                'ScriptaHub - Password Reset Code',
                f'Your password reset code is: {code}\n\nIf you did not request this, ignore this email.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            return Response({"message": "Reset code sent."})
        except User.DoesNotExist:
            return Response({"message": "If this email exists, a code has been sent."})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        try:
            user = User.objects.get(email=email)
            if user.verification_code == code:
                user.set_password(new_password)
                user.verification_code = None
                user.save()
                return Response({"message": "Password reset successful."})
            return Response({"error": "Invalid code."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

# --- ADMIN VIEWS ---
class AdminUserSerializer(serializers.ModelSerializer):
    is_verified = serializers.SerializerMethodField()
    is_rejected = serializers.SerializerMethodField()
    verification_doc = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "username", "role", "is_active", "is_verified", "is_rejected", "verification_doc"]

    def get_is_verified(self, obj):
        try: return obj.writer_profile.verified
        except: return False
    def get_is_rejected(self, obj):
        try: return obj.writer_profile.is_rejected
        except: return False
    def get_verification_doc(self, obj):
        try:
            if obj.writer_profile.verification_doc: return obj.writer_profile.verification_doc.url
        except: pass
        return None

class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")

class ApproveMentorView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role="mentor")
            profile, _ = WriterProfile.objects.get_or_create(user=user)
            profile.verified = True
            profile.is_rejected = False
            profile.save()
            return Response({"message": "Mentor approved."})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class RejectMentorView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role="mentor")
            profile, _ = WriterProfile.objects.get_or_create(user=user)
            profile.verified = False
            profile.is_rejected = True
            profile.save()
            user.is_active = False
            user.save()
            return Response({"message": "Mentor rejected."})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class DeactivateUserView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = not user.is_active
            user.save()
            return Response({"message": "User status toggled."})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class AdminRevenueView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        from apps.money.models import Wallet
        total_available = Wallet.objects.aggregate(Sum('available_kobo'))['available_kobo__sum'] or 0
        total_escrow = Wallet.objects.aggregate(Sum('escrow_kobo'))['escrow_kobo__sum'] or 0
        return Response({"total_available": total_available, "total_escrow": total_escrow, "estimated_revenue": int(total_available * 0.15)})

class BroadcastView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        title = request.data.get("title")
        message = request.data.get("message")
        if not title or not message: return Response({"error": "Title and message required"}, status=400)
        for user in User.objects.filter(role__in=["student", "mentor"]):
            Notification.objects.create(user=user, title=title, message=message)
        return Response({"message": "Announcement sent."})

# --- PLATFORM SETTINGS VIEWS ---
class PlatformSettingsView(APIView):
    permission_classes = [AllowAny] 
    def get(self, request):
        settings_obj, _ = PlatformSettings.objects.get_or_create(id=1)
        return Response({"is_find_writer_locked": settings_obj.is_find_writer_locked})

class ToggleFindWriterLockView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        settings_obj, _ = PlatformSettings.objects.get_or_create(id=1)
        settings_obj.is_find_writer_locked = not settings_obj.is_find_writer_locked
        settings_obj.save()
        return Response({"is_find_writer_locked": settings_obj.is_find_writer_locked})