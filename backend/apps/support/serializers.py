from rest_framework import serializers
from .models import Complaint, ComplaintMessage

class ComplaintMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    
    class Meta:
        model = ComplaintMessage
        fields = ["id", "body", "author_name", "is_admin", "attachment", "created_at"]

class ComplaintSerializer(serializers.ModelSerializer):
    messages = ComplaintMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Complaint
        fields = ["id", "subject", "body", "status", "refund_requested", "attachment", "messages", "created_at"]