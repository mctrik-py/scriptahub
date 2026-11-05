from django.db import models
from django.conf import settings

class ServiceType(models.Model):
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=80)

    def __str__(self):
        return self.name

class Group(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        FULL = "full", "Full"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_groups")
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through="GroupMember", related_name="student_groups")
    is_public = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    max_members = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Admin: {self.admin.username})"

class GroupMember(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="member_requests")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_memberships")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("group", "student")

    def __str__(self):
        return f"{self.student.username} in {self.group.name} ({self.status})"

class Engagement(models.Model):
    class Status(models.TextChoices):
        PENDING_APPROVAL = "pending_approval", "Pending Approval"
        REQUESTED = "requested", "Requested"
        MATCHED = "matched", "Matched"
        IN_PROGRESS = "in_progress", "In Progress"
        REVIEW = "review", "Review"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="engagements")
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="mentorships")
    group = models.ForeignKey(Group, null=True, blank=True, on_delete=models.SET_NULL, related_name="engagements")
    topic = models.ForeignKey("projects.Topic", null=True, blank=True, on_delete=models.SET_NULL)
    
    service_type = models.ForeignKey(ServiceType, on_delete=models.PROTECT)
    specific_chapter = models.CharField(max_length=50, blank=True, null=True)
    is_implementation = models.BooleanField(default=False)
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.REQUESTED)
    total_kobo = models.BigIntegerField(default=0)
    deadline = models.DateField(null=True, blank=True)
    own_work_ack_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.student.email})"

class Milestone(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUBMITTED = "submitted", "Submitted"
        RELEASED = "released", "Released"
        DISPUTED = "disputed", "Disputed"

    engagement = models.ForeignKey(Engagement, related_name="milestones", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    amount_kobo = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.engagement.title} - {self.title}"

class EngagementActivity(models.Model):
    engagement = models.ForeignKey(Engagement, related_name="activity", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    kind = models.CharField(max_length=40)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.kind} by {self.actor.email}"

class ChatMessage(models.Model):
    engagement = models.ForeignKey(Engagement, related_name="messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg from {self.sender.email} on {self.engagement.title}"

class Document(models.Model):
    engagement = models.ForeignKey(Engagement, related_name="documents", on_delete=models.CASCADE)
    file = models.URLField(max_length=500)
    original_name = models.CharField(max_length=255, blank=True, default="")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
class GroupChat(models.Model):
    group = models.ForeignKey(Group, related_name="chat_messages", on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Msg from {self.sender.username} in {self.group.name}"