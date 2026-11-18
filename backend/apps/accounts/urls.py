from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MeView, NotificationListView, 
    CustomTokenObtainPairView, PasswordResetRequestView,
    VerifyEmailView, ConfirmEmailChangeView, ConfirmLoginView,
    AdminUserListView, ApproveMentorView, RejectMentorView, 
    DeactivateUserView, AdminRevenueView, BroadcastView,
    MarkNotificationsReadView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/mark-read/', MarkNotificationsReadView.as_view(), name='mark-notifications-read'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('confirm-email-change/', ConfirmEmailChangeView.as_view(), name='confirm-email-change'),
    path('confirm-login/', ConfirmLoginView.as_view(), name='confirm-login'),
    
    # Admin
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/approve-mentor/<int:user_id>/', ApproveMentorView.as_view(), name='admin-approve-mentor'),
    path('admin/reject-mentor/<int:user_id>/', RejectMentorView.as_view(), name='admin-reject-mentor'),
    path('admin/deactivate-user/<int:user_id>/', DeactivateUserView.as_view(), name='admin-deactivate-user'),
    path('admin/revenue/', AdminRevenueView.as_view(), name='admin-revenue'),
    path('admin/broadcast/', BroadcastView.as_view(), name='admin-broadcast'),
]