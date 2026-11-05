from rest_framework import serializers
from .models import Engagement, Milestone, EngagementActivity, ChatMessage, Document

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ["id", "title", "amount_kobo", "status", "due_date"]

class ActivitySerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)
    
    class Meta:
        model = EngagementActivity
        fields = ["id", "kind", "note", "actor_email", "created_at"]

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender_last_active = serializers.DateTimeField(source="sender.last_active", read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ["id", "message", "sender_name", "sender_last_active", "created_at"]

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "file", "original_name", "uploaded_by", "created_at"] # Added original_name

class EngagementSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source="mentor.username", read_only=True, default="Unassigned")
    student_name = serializers.CharField(source="student.username", read_only=True)
    mentor_last_active = serializers.DateTimeField(source="mentor.last_active", read_only=True, allow_null=True, default=None)
    
    milestones = MilestoneSerializer(many=True, read_only=True)
    activity = ActivitySerializer(many=True, read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Engagement
        fields = [
            "id", "title", "status", "total_kobo", "deadline",
            "mentor_name", "student_name", "mentor_last_active", 
            "milestones", "activity", "messages", "documents", "created_at"
        ]