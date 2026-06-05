# api/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count
from .models import Profile, CareerPath, Badge, UserBadge, Progress
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ProfileSerializer,
    CareerPathSerializer, CareerPathListSerializer, BadgeSerializer,
    ProgressSerializer, AdminUserSerializer, AdminBadgeSerializer
)
from .gemini_service import (
    generate_career_path,
    generate_fork_options,
    regenerate_subtree,
    replace_node_subtree,
)
from .resume_parser import extract_text, parse_resume_profile
import json


# ============== Helper Functions ==============
def api_response(success, data=None, message="", error=None, status_code=200):
    """Standard API response format"""
    response = {"success": success}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if error:
        response["error"] = error
    return Response(response, status=status_code)


def check_and_award_badges(user, progress):
    """Auto-award badges based on user progress milestones"""
    badges = Badge.objects.all()
    earned_ids = set(UserBadge.objects.filter(user=user).values_list('badge_id', flat=True))
    
    for badge in badges:
        if badge.id in earned_ids:
            continue
        
        # Check by category + points_required thresholds
        should_award = False
        
        if badge.category == 'explorer':
            # Award explorer badges based on paths explored
            if badge.points_required > 0 and progress.paths_explored >= badge.points_required:
                should_award = True
            elif badge.points_required == 0 and progress.paths_explored >= 1:
                should_award = True
                
        elif badge.category == 'decision':
            # Award decision badges based on decisions made
            if badge.points_required > 0 and progress.decisions_made >= badge.points_required:
                should_award = True
            elif badge.points_required == 0 and progress.decisions_made >= 5:
                should_award = True
                
        elif badge.category == 'planner':
            # Award planner badges based on saved paths
            saved_count = CareerPath.objects.filter(user=user).count()
            if badge.points_required > 0 and saved_count >= badge.points_required:
                should_award = True
            elif badge.points_required == 0 and saved_count >= 3:
                should_award = True
                
        elif badge.category == 'specialist':
            # Award specialist badges based on level
            if badge.points_required > 0 and progress.level >= badge.points_required:
                should_award = True
            elif badge.points_required == 0 and progress.level >= 5:
                should_award = True
        
        if should_award:
            UserBadge.objects.create(user=user, badge=badge)


# ============== AUTH VIEWS ==============
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user"""
    print("Register request data:", request.data)  # Debug
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return api_response(
                True,
                {"user": UserSerializer(user).data, "token": token.key},
                "Registration successful!",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            print("Registration error:", str(e))  # Debug
            return api_response(False, error="Registration failed: " + str(e), status_code=status.HTTP_400_BAD_REQUEST)
    print("Serializer errors:", serializer.errors)  # Debug
    return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return token"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if user:
            if user.is_staff or user.is_superuser:
                return api_response(
                    False,
                    error="Admin accounts must sign in through the admin portal.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            token, _ = Token.objects.get_or_create(user=user)
            return api_response(
                True,
                {"user": UserSerializer(user).data, "token": token.key},
                "Login successful!"
            )
        return api_response(False, error="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)
    return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by deleting token"""
    try:
        request.user.auth_token.delete()
    except:
        pass
    return api_response(True, message="Logged out successfully")


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """Admin login - verify superuser status"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if user:
            if not (user.is_staff and user.is_superuser):
                return api_response(False, error="Admin access only", status_code=status.HTTP_403_FORBIDDEN)
            
            token, _ = Token.objects.get_or_create(user=user)
            return api_response(
                True,
                {"username": user.username, "token": token.key},
                "Admin login successful!"
            )
        return api_response(False, error="Invalid credentials", status_code=status.HTTP_401_UNAUTHORIZED)
    return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


# ============== PROFILE VIEWS ==============
@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get, create, or update user profile"""
    
    if request.method == 'GET':
        try:
            profile = Profile.objects.get(user=request.user)
            return api_response(True, ProfileSerializer(profile).data)
        except Profile.DoesNotExist:
            return api_response(False, error="Profile not found", status_code=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'POST':
        if Profile.objects.filter(user=request.user).exists():
            return api_response(False, error="Profile already exists", status_code=status.HTTP_400_BAD_REQUEST)
        
        serializer = ProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return api_response(True, serializer.data, "Profile created!", status_code=status.HTTP_201_CREATED)
        return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return api_response(False, error="Profile not found", status_code=status.HTTP_404_NOT_FOUND)
        
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return api_response(True, serializer.data, "Profile updated!")
        return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    """Parse an uploaded PDF/DOCX resume and return structured profile hints."""
    uploaded = request.FILES.get('resume')
    if not uploaded:
        return api_response(False, error="No file uploaded", status_code=status.HTTP_400_BAD_REQUEST)

    name = uploaded.name.lower()
    if not (name.endswith('.pdf') or name.endswith('.docx')):
        return api_response(False, error="Only PDF or DOCX files are supported", status_code=status.HTTP_400_BAD_REQUEST)

    if uploaded.size > 2 * 1024 * 1024:
        return api_response(False, error="File too large (max 2MB)", status_code=status.HTTP_400_BAD_REQUEST)

    text = extract_text(uploaded, uploaded.name)
    if not text.strip():
        return api_response(False, error="Could not read text from file", status_code=status.HTTP_400_BAD_REQUEST)

    parsed_profile = parse_resume_profile(text)
    extracted = parsed_profile["extracted"]
    skills = extracted.get("skills", [])

    return api_response(
        True,
        {
            "skills": skills,
            "skills_count": len(skills),
            "skills_string": ", ".join(skills),
            "skills_with_levels": extracted.get("skills_with_levels", {}),
            "profile_patch": {
                "education_level": extracted.get("education_level"),
                "years_experience": extracted.get("years_experience"),
                "current_job": extracted.get("current_job"),
                "desired_field_suggestions": extracted.get(
                    "desired_field_suggestions", []
                ),
            },
            "confidence": parsed_profile.get("confidence", {}),
            "unresolved_fields": parsed_profile.get("unresolved_fields", []),
        },
        f"Resume parsed. Found {len(skills)} skills",
    )


# ============== SIMULATOR VIEWS ==============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_path(request):
    """Generate initial career path using Gemini AI"""
    try:
        profile = Profile.objects.get(user=request.user)
        profile_data = ProfileSerializer(profile).data
    except Profile.DoesNotExist:
        return api_response(False, error="Please create a profile first", status_code=status.HTTP_400_BAD_REQUEST)

    # Generate path using Gemini
    path_data = generate_career_path(profile_data)

    # Update progress
    progress, _ = Progress.objects.get_or_create(user=request.user)
    progress.paths_explored += 1
    progress.calculate_level()
    progress.save()

    # Check for badge awards
    check_and_award_badges(request.user, progress)

    return api_response(
        True, path_data, "Career path generated with staged branch expansion!"
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def regenerate_node_subtree(request):
    """Regenerate a selected node subtree while preserving the rest of the tree."""
    tree_data = request.data.get("treeData") or {}
    selected_node = request.data.get("selectedNode") or {}
    node_id = selected_node.get("id")

    if not node_id:
        return api_response(
            False,
            error="selectedNode.id is required",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    try:
        profile = Profile.objects.get(user=request.user)
        profile_data = ProfileSerializer(profile).data
    except Profile.DoesNotExist:
        return api_response(
            False,
            error="Please create a profile first",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # Apply optional user edits before regeneration.
    node_updates = request.data.get("nodeUpdates") or {}
    selected_node.update(node_updates)

    new_subtree = regenerate_subtree(profile_data, selected_node)
    updated_tree, changed = replace_node_subtree(tree_data, node_id, new_subtree)

    if not changed:
        return api_response(
            False,
            error="Selected node not found in tree",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    progress, _ = Progress.objects.get_or_create(user=request.user)
    progress.decisions_made += 1
    progress.calculate_level()
    progress.save()
    check_and_award_badges(request.user, progress)

    return api_response(
        True,
        {
            "treeData": updated_tree,
            "updatedSubtree": new_subtree,
            "progress": ProgressSerializer(progress).data,
        },
        "Selected subtree regenerated successfully",
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fork_options(request):
    """Get fork options for a node"""
    node_data = request.data.get('node', {})
    
    try:
        profile = Profile.objects.get(user=request.user)
        profile_data = ProfileSerializer(profile).data
    except Profile.DoesNotExist:
        profile_data = {}
    
    options = generate_fork_options(node_data, profile_data)
    
    return api_response(True, options)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def select_fork(request):
    """Select a fork option and update progress"""
    # Update decisions count
    progress, _ = Progress.objects.get_or_create(user=request.user)
    progress.decisions_made += 1
    progress.calculate_level()
    progress.save()
    
    # Check for badge awards
    check_and_award_badges(request.user, progress)
    
    # Return the selected option data
    selected_option = request.data.get('option', {})
    return api_response(True, {"selected": selected_option, "progress": ProgressSerializer(progress).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_paths(request):
    """Get all saved career paths for user"""
    paths = CareerPath.objects.filter(user=request.user).order_by('-created_at')
    serializer = CareerPathListSerializer(paths, many=True)
    return api_response(True, serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_path(request):
    """Save a career path"""
    path_name = request.data.get('pathName', 'Untitled Path')
    tree_data = request.data.get('treeData', {})
    decisions_count = request.data.get('decisionsCount', 0)
    
    career_path = CareerPath.objects.create(
        user=request.user,
        path_name=path_name,
        tree_data=json.dumps(tree_data),
        decisions_count=decisions_count
    )
    
    return api_response(
        True, 
        CareerPathSerializer(career_path).data, 
        "Path saved successfully!",
        status_code=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_path(request, path_id):
    """Delete a saved career path"""
    try:
        path = CareerPath.objects.get(id=path_id, user=request.user)
        path.delete()
        return api_response(True, message="Path deleted successfully")
    except CareerPath.DoesNotExist:
        return api_response(False, error="Path not found", status_code=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_path(request, path_id):
    """Get a specific saved career path"""
    try:
        path = CareerPath.objects.get(id=path_id, user=request.user)
        return api_response(True, CareerPathSerializer(path).data)
    except CareerPath.DoesNotExist:
        return api_response(False, error="Path not found", status_code=status.HTTP_404_NOT_FOUND)


# ============== GAMIFICATION VIEWS ==============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def badges(request):
    """Get all badges with earned status"""
    all_badges = Badge.objects.all()
    serializer = BadgeSerializer(all_badges, many=True, context={'user': request.user})
    return api_response(True, serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress_stats(request):
    """Get user progress statistics"""
    progress, _ = Progress.objects.get_or_create(user=request.user)
    serializer = ProgressSerializer(progress)
    return api_response(True, serializer.data)


# ============== ADMIN VIEWS ==============
@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Get admin dashboard statistics"""
    stats = {
        "totalUsers": User.objects.count(),
        "totalPaths": CareerPath.objects.count(),
        "totalBadges": Badge.objects.count(),
        "activeUsers": User.objects.filter(is_active=True).count(),
        "recentUsers": AdminUserSerializer(
            User.objects.order_by('-date_joined')[:5], many=True
        ).data,
    }
    return api_response(True, stats)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users(request):
    """Get all users for admin"""
    users = User.objects.all().order_by('-date_joined')
    serializer = AdminUserSerializer(users, many=True)
    return api_response(True, serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
    """Delete a user (admin only)"""
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return api_response(False, error="Cannot delete superuser", status_code=status.HTTP_403_FORBIDDEN)
        user.delete()
        return api_response(True, message="User deleted successfully")
    except User.DoesNotExist:
        return api_response(False, error="User not found", status_code=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_badges(request):
    """Get all badges or create new badge (admin)"""
    if request.method == 'GET':
        all_badges = Badge.objects.all()
        serializer = AdminBadgeSerializer(all_badges, many=True)
        return api_response(True, serializer.data)
    
    elif request.method == 'POST':
        serializer = AdminBadgeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return api_response(True, serializer.data, "Badge created!", status_code=status.HTTP_201_CREATED)
        return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_badge_detail(request, badge_id):
    """Update or delete a badge (admin)"""
    try:
        badge = Badge.objects.get(id=badge_id)
    except Badge.DoesNotExist:
        return api_response(False, error="Badge not found", status_code=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = AdminBadgeSerializer(badge, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return api_response(True, serializer.data, "Badge updated!")
        return api_response(False, error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        badge.delete()
        return api_response(True, message="Badge deleted successfully")
