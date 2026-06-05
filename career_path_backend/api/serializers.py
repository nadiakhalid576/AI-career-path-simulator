# api/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, CareerPath, Badge, UserBadge, Progress


class EmptyToZeroIntegerField(serializers.IntegerField):
    """Custom IntegerField that converts empty strings to 0"""

    def to_internal_value(self, data):
        if data == "" or data is None:
            return 0
        return super().to_internal_value(data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Create empty progress for new user
        Progress.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class ProfileSerializer(serializers.ModelSerializer):
    ALLOWED_SKILL_LEVELS = {"basic", "intermediate", "expert"}

    # Override fields to allow blank/empty for optional fields
    education_level = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.CharField(required=False, allow_blank=True)
    desired_field = serializers.CharField(required=False, allow_blank=True)
    current_job = serializers.CharField(required=False, allow_blank=True)
    years_experience = EmptyToZeroIntegerField(required=False)

    class Meta:
        model = Profile
        fields = [
            "id",
            "full_name",
            "education_level",
            "current_job",
            "skills",
            "skills_with_levels",
            "years_experience",
            "desired_field",
            "salary_expectation",
            "salary_range",
            "location",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_skills_with_levels(self, value):
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                "skills_with_levels must be an object map."
            )

        normalized = {}
        for skill, level in value.items():
            skill_name = str(skill).strip()
            level_name = str(level).strip().lower()
            if not skill_name:
                continue
            if level_name not in self.ALLOWED_SKILL_LEVELS:
                raise serializers.ValidationError(
                    f"Invalid level '{level}' for skill '{skill_name}'. Use basic, intermediate, or expert."
                )
            normalized[skill_name] = level_name
        return normalized

    def validate(self, attrs):
        # Remove None/empty values for required fields during partial update
        # This allows PUT requests with incomplete data without overwriting existing values
        if self.partial:
            if attrs.get("education_level") == "":
                attrs.pop("education_level", None)
            if attrs.get("desired_field") == "":
                attrs.pop("desired_field", None)
            if attrs.get("current_job") == "":
                attrs.pop("current_job", None)
            if attrs.get("skills") == "":
                attrs.pop("skills", None)

        if attrs.get("years_experience") is None or attrs.get("years_experience") == "":
            attrs["years_experience"] = 0

        skills_with_levels = attrs.get("skills_with_levels")
        skills_text = attrs.get("skills") or ""

        # Backward compatibility: if only legacy skills text is sent,
        # infer basic level entries for each skill.
        if not skills_with_levels and skills_text:
            inferred = {}
            for item in skills_text.split(","):
                skill_name = item.strip()
                if skill_name:
                    inferred[skill_name] = "basic"
            attrs["skills_with_levels"] = inferred

        # Keep legacy comma-separated text synchronized for existing UI paths.
        if attrs.get("skills_with_levels") and not skills_text:
            attrs["skills"] = ", ".join(attrs["skills_with_levels"].keys())

        return attrs


class CareerPathSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerPath
        fields = ['id', 'path_name', 'tree_data', 'decisions_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CareerPathListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing paths"""
    class Meta:
        model = CareerPath
        fields = ['id', 'path_name', 'decisions_count', 'created_at']


class BadgeSerializer(serializers.ModelSerializer):
    is_earned = serializers.SerializerMethodField()
    earned_at = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'requirements', 'category', 'is_earned', 'earned_at']

    def get_is_earned(self, obj):
        user = self.context.get('user')
        if user:
            return UserBadge.objects.filter(user=user, badge=obj).exists()
        return False

    def get_earned_at(self, obj):
        user = self.context.get('user')
        if user:
            user_badge = UserBadge.objects.filter(user=user, badge=obj).first()
            if user_badge:
                return user_badge.earned_at
        return None


class ProgressSerializer(serializers.ModelSerializer):
    badges_earned = serializers.SerializerMethodField()
    total_badges = serializers.SerializerMethodField()

    class Meta:
        model = Progress
        fields = ['paths_explored', 'decisions_made', 'level', 'badges_earned', 'total_badges']

    def get_badges_earned(self, obj):
        return UserBadge.objects.filter(user=obj.user).count()

    def get_total_badges(self, obj):
        return Badge.objects.count()


# Admin Serializers
class AdminUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    paths_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'is_active', 'profile', 'paths_count']

    def get_paths_count(self, obj):
        return CareerPath.objects.filter(user=obj).count()


class AdminBadgeSerializer(serializers.ModelSerializer):
    earned_count = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'requirements', 'category', 'points_required', 'earned_count']

    def get_earned_count(self, obj):
        return UserBadge.objects.filter(badge=obj).count()
