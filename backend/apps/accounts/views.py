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
from .models import Notification, WriterProfile

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except Exception:
            if 'email' in attrs:
                send_mail(
                    'ScriptaHub - Failed Login Attempt',
                    f'Someone tried to log into your ScriptaHub account with your email.\n\nIf this was you, please reset your password: http://localhost:5173/forgot-password\n\nIf not, ignore this email.',
                    settings.DEFAULT_FROM_EMAIL,
                    [attrs['email']],
                    fail_silently=True,
                )
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
                if not profile.verified:
                    raise serializers.ValidationError({"detail": "Your account is pending admin approval."})
            except WriterProfile.DoesNotExist:
                raise serializers.ValidationError({"detail": "Mentor profile not found."})

        # --- BYPASS LOGIC ---
        bypass_emails = ["olaosegbaj@gmail.com", "admin@scriptahub.com"]
        is_company_pro = self.user.email.endswith("@scriptahub.com")
        
        if actual_role == "admin" or is_company_pro or self.user.email in bypass_emails:
            refresh = RefreshToken.for_user(self.user)
            return {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": actual_role,
            }

        code = ''.join(random.choices(string.digits, k=6))
        self.user.verification_code = code
        self.user.save()

        send_mail(
            'ScriptaHub - Login Verification Code',
            f'Hello {self.user.username},\n\nYour login verification code is: {code}\n\nEnter this code to complete your login.\n\nIf you did not request this, ignore this email.\n\nBest,\nScriptaHub Team',
            settings.DEFAULT_FROM_EMAIL,
            [self.user.email],
            fail_silently=True,
        )

        return {
            "detail": "Verification code sent to your email.",
            "verification_required": True,
            "email": self.user.email,
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
            user.save()
            
            if user.role == "mentor":
                WriterProfile.objects.filter(user=user).update(verified=False, is_rejected=False)
                send_mail(
                    'Welcome to ScriptaHub - Application Received',
                    f'Hello {user.username},\n\nYour application to become a ScriptaHub mentor has been received and is under review.\n\nYou will receive a notification once a decision is made.\n\nBest,\nScriptaHub Team',
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=True,
                )
            
            if user.role in ["student", "mentor"]:
                user.email_verified = True
                user.save()

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
        user = self.request.user
        user.last_active = timezone.now()
        user.save()
        return user

    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        data = UserSerializer(user).data
        
        data["student_profile"] = None
        data["writer_profile"] = None
        
        try:
            data["student_profile"] = {
                "institution": user.student_profile.institution,
                "level": user.student_profile.level,
            }
        except:
            pass
        
        try:
            data["writer_profile"] = {
                "verified": user.writer_profile.verified,
                "specialization": user.writer_profile.specialization,
            }
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
        if not email or not code:
            return Response({"error": "Email and code required"}, status=400)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.verification_code == code:
            user.email_verified = True
            user.verification_code = None
            user.save()
            
            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "verified",
                "role": user.role,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            })
        return Response({"error": "Invalid code"}, status=400)

class ConfirmEmailChangeView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"error": "Code required"}, status=400)
        
        user = request.user
        if not user.pending_email:
            return Response({"error": "No pending email change."}, status=400)
        
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
        if not email or not code:
            return Response({"error": "Email and code required"}, status=400)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.verification_code == code:
            user.verification_code = None
            user.save()
            
            refresh = RefreshToken.for_user(user)
            return Response({
                "status": "verified",
                "role": user.role,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            })
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

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        return Response({"message": "If this email exists, a reset link has been sent."})

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
            
            send_mail(
                'ScriptaHub - Account Approved ✅',
                f'Hello {user.username},\n\nCongratulations! Your application to become a mentor has been approved. You can now log in and start accepting projects.\n\nWelcome aboard,\nScriptaHub Team',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
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
            
            send_mail(
                'ScriptaHub - Application Status',
                f'Hello {user.username},\n\nWe regret to inform you that your application to become a mentor was not approved at this time.\n\nIf you believe this is a mistake, please contact support@scriptahub.com.\n\nBest,\nScriptaHub Team',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
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
        total_revenue = int(total_available * 0.15) 
        return Response({
            "total_available": total_available,
            "total_escrow": total_escrow,
            "estimated_revenue": total_revenue
        })

class BroadcastView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request):
        title = request.data.get("title")
        message = request.data.get("message")
        if not title or not message:
            return Response({"error": "Title and message required"}, status=400)
        users = User.objects.filter(role__in=["student", "mentor"])
        for user in users:
            Notification.objects.create(user=user, title=title, message=message)
        return Response({"message": "Announcement sent to all users."})