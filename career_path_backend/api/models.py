# api/models.py
from django.db import models
from django.contrib.auth.models import User
import json


class Profile(models.Model):
    """User profile with career-related information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=100)
    education_level = models.CharField(max_length=50, choices=[
        ('High School', 'High School'),
        ("Bachelor's", "Bachelor's"),
        ("Master's", "Master's"),
        ('PhD', 'PhD'),
        ('Other', 'Other'),
    ])
    current_job = models.CharField(max_length=100)
    skills = models.TextField(help_text="Comma-separated skills")
    skills_with_levels = models.JSONField(
        default=dict,
        blank=True,
        help_text="Map of skill to proficiency (basic/intermediate/expert)",
    )
    years_experience = models.IntegerField(default=0)
    desired_field = models.CharField(max_length=100)
    salary_expectation = models.CharField(max_length=80, blank=True, null=True)
    salary_range = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.user.username}"


class CareerPath(models.Model):
    """Saved career paths with tree structure"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='career_paths')
    path_name = models.CharField(max_length=100)
    tree_data = models.TextField(help_text="JSON tree structure")
    decisions_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_tree_data(self):
        return json.loads(self.tree_data) if self.tree_data else None

    def set_tree_data(self, data):
        self.tree_data = json.dumps(data)

    def __str__(self):
        return f"{self.path_name} - {self.user.username}"


class Badge(models.Model):
    """Achievement badges"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="🏆")
    requirements = models.TextField()
    category = models.CharField(max_length=50, choices=[
        ('explorer', 'Explorer'),
        ('decision', 'Decision Maker'),
        ('planner', 'Planner'),
        ('specialist', 'Specialist'),
    ])
    points_required = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """Tracks which badges users have earned"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class Progress(models.Model):
    """User progress tracking"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    paths_explored = models.IntegerField(default=0)
    decisions_made = models.IntegerField(default=0)
    total_time_spent = models.IntegerField(default=0)  # in minutes
    level = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Level {self.level}"

    def calculate_level(self):
        """Simple level calculation based on activity"""
        total_points = (self.paths_explored * 10) + (self.decisions_made * 5)
        self.level = (total_points // 100) + 1
        return self.level
