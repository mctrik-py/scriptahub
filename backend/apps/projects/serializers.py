from rest_framework import serializers
from .models import Topic, Department

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "code", "name"]

class TopicSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    
    class Meta:
        model = Topic
        fields = ["id", "title", "description", "department", "tech_stack", "difficulty", "year"]