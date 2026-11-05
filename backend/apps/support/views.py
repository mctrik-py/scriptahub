from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Complaint, ComplaintMessage
from .serializers import ComplaintSerializer, ComplaintMessageSerializer

class ComplaintListView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Complaint.objects.filter(complainant=self.request.user).order_by("-created_at")
    def perform_create(self, serializer):
        serializer.save(complainant=self.request.user)

class ComplaintDetailView(generics.RetrieveAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Complaint.objects.filter(complainant=self.request.user)

class ComplaintMessageCreateView(generics.CreateAPIView):
    serializer_class = ComplaintMessageSerializer
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        complaint_id = self.kwargs.get('pk')
        complaint = Complaint.objects.get(id=complaint_id)
        is_admin = self.request.user.is_staff
        serializer.save(author=self.request.user, complaint=complaint, is_admin=is_admin)

class RequestRefundView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(id=pk, complainant=request.user)
            complaint.refund_requested = True
            complaint.save()
            return Response({"message": "Refund requested."})
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=404)

# --- ADMIN VIEWS ---
class AdminComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAdminUser]
    queryset = Complaint.objects.all().order_by("-created_at")

class AdminApproveRefundView(APIView):
    permission_classes = [IsAdminUser]
    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(id=pk)
            complaint.refund_requested = False
            complaint.status = "resolved"
            complaint.save()
            
            ComplaintMessage.objects.create(
                complaint=complaint,
                author=request.user,
                body="Your refund has been approved and processed to your wallet.",
                is_admin=True
            )
            return Response({"message": "Refund approved."})
        except Complaint.DoesNotExist:
            return Response({"error": "Complaint not found"}, status=404)