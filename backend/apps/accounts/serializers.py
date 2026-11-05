from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, WriterProfile, Department

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "role", "email_verified", "is_superuser"]
        read_only_fields = ["id", "email_verified"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    institution = serializers.CharField(write_only=True, required=False, allow_blank=True)
    level = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bio = serializers.CharField(write_only=True, required=False, allow_blank=True)
    verification_doc = serializers.FileField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "email", "username", "password", "role", 
            "institution", "level", "department", "bio", "verification_doc"
        ]

    def create(self, validated_data):
        institution = validated_data.pop("institution", "")
        level = validated_data.pop("level", "")
        dept_name = validated_data.pop("department", "")
        bio = validated_data.pop("bio", "")
        verification_doc = validated_data.pop("verification_doc", None)

        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == "student":
            dept = None
            if dept_name:
                dept, _ = Department.objects.get_or_create(
                    code=dept_name.lower().replace(" ", "_"), 
                    defaults={"name": dept_name}
                )
            StudentProfile.objects.create(
                user=user, institution=institution, 
                level=level, department=dept
            )
        elif user.role == "mentor":
            WriterProfile.objects.create(
                user=user, 
                bio=bio, 
                verification_doc=verification_doc,
                verified=False
            )

        return user