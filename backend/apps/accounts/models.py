from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        MENTOR = "mentor", "Mentor"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    email_verified = models.BooleanField(default=False)
    google_id = models.CharField(max_length=64, blank=True, null=True)
    own_work_ack_at = models.DateTimeField(null=True, blank=True)
    last_active = models.DateTimeField(auto_now=True)
    verification_code = models.CharField(max_length=10, blank=True, null=True)
    pending_email = models.EmailField(blank=True, null=True)  # <--- ADDED

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"

class Department(models.Model):
    code = models.SlugField(unique=True)          
    name = models.CharField(max_length=120)
    level_group = models.CharField(max_length=20, default="tertiary")  

    def __str__(self):
        return self.name

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    institution = models.CharField(max_length=200, blank=True)
    department = models.ForeignKey(Department, null=True, on_delete=models.SET_NULL)
    level = models.CharField(max_length=30, blank=True)   
    project_stage = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return f"Student: {self.user.email}"

class WriterProfile(models.Model):
    class SpecialistType(models.TextChoices):
        WRITER = "writer", "Writer"
        ANALYST = "analyst", "Data Analyst"
        IMPLEMENTATION = "implementation", "Implementation Specialist"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="writer_profile")
    bio = models.TextField(blank=True)
    verified = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)  # <--- ADDED
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    specialist_type = models.CharField(max_length=30, choices=SpecialistType.choices, default=SpecialistType.WRITER)
    specialization = models.CharField(max_length=255, blank=True)
    tools = models.CharField(max_length=255, blank=True)
    verification_doc = models.FileField(upload_to="verifications/", blank=True, null=True)

    def __str__(self):
        return f"Mentor: {self.user.email} - {self.specialist_type}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} -> {self.user.email}"