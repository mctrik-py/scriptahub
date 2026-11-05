from django.db import models
from django.conf import settings

class Complaint(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_REVIEW = "in_review", "In Review"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    complainant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    attachment = models.FileField(upload_to="complaints/", blank=True, null=True) # Added file upload
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    refund_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.status}"

class ComplaintMessage(models.Model):
    complaint = models.ForeignKey(Complaint, related_name="messages", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    attachment = models.FileField(upload_to="complaints/messages/", blank=True, null=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message on {self.complaint.subject}"