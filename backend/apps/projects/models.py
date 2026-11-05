from django.db import models
from django.conf import settings

class Department(models.Model):
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=120)

    def __str__(self):
        return self.name

class Topic(models.Model):
    class Difficulty(models.TextChoices):
        BEGINNER = "beginner", "Beginner"
        INTERMEDIATE = "intermediate", "Intermediate"
        ADVANCED = "advanced", "Advanced"

    title = models.CharField(max_length=255)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    tech_stack = models.JSONField(default=list, blank=True) # e.g. ["Python", "Django"]
    difficulty = models.CharField(max_length=20, choices=Difficulty.choices, default=Difficulty.INTERMEDIATE)
    year = models.PositiveSmallIntegerField(default=2026)
    is_custom = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title