from django.urls import path
from .views import (
    ComplaintListView, ComplaintDetailView, ComplaintMessageCreateView, 
    RequestRefundView, AdminComplaintListView, AdminApproveRefundView
)

urlpatterns = [
    path('complaints/', ComplaintListView.as_view(), name='complaint-list'),
    path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('complaints/<int:pk>/messages/', ComplaintMessageCreateView.as_view(), name='complaint-messages'),
    path('complaints/<int:pk>/refund/', RequestRefundView.as_view(), name='complaint-refund'),
    
    # Admin
    path('admin/complaints/', AdminComplaintListView.as_view(), name='admin-complaints'),
    path('admin/complaints/<int:pk>/approve-refund/', AdminApproveRefundView.as_view(), name='admin-approve-refund'),
]