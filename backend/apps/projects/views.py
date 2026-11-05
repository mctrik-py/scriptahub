from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Topic
from .serializers import TopicSerializer

class TopicListView(generics.ListAPIView):
    queryset = Topic.objects.all().order_by("-created_at")
    serializer_class = TopicSerializer
    permission_classes = [AllowAny]

class TopicRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        description = request.data.get("description")
        if not description:
            return Response({"error": "Description is required"}, status=400)
        
        # For now, we just create a custom Topic marked as unapproved/pending
        # In the next step, we'll add a proper TopicRequest model, but this works for testing.
        Topic.objects.create(
            title="Custom Request (Pending)",
            description=description,
            department_id=1, # Defaults to CS
            is_custom=True
        )
        return Response({"message": "Request submitted"}, status=201)