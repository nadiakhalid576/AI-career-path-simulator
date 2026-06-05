# api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Auth endpoints
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login, name="login"),
    path("auth/logout/", views.logout, name="logout"),
    path("admin/login/", views.admin_login, name="admin_login"),
    # Profile endpoints
    path("profile/", views.profile, name="profile"),
    path("profile/view/", views.profile, name="profile_view"),  # Alias
    path("profile/create/", views.profile, name="profile_create"),  # Alias
    path("profile/update/", views.profile, name="profile_update"),  # Alias
    path("profile/upload-resume/", views.upload_resume, name="upload_resume"),
    # Simulator endpoints
    path("simulator/generate/", views.generate_path, name="generate_path"),
    path(
        "simulator/regenerate-subtree/",
        views.regenerate_node_subtree,
        name="regenerate_node_subtree",
    ),
    path("simulator/fork/", views.fork_options, name="fork_options"),
    path("simulator/select-fork/", views.select_fork, name="select_fork"),
    path("simulator/saved-paths/", views.saved_paths, name="saved_paths"),
    path("simulator/save-path/", views.save_path, name="save_path"),
    path("simulator/delete-path/<int:path_id>/", views.delete_path, name="delete_path"),
    path("simulator/path/<int:path_id>/", views.get_path, name="get_path"),
    # Gamification endpoints
    path("gamification/badges/", views.badges, name="badges"),
    path("gamification/progress/", views.progress_stats, name="progress"),
    # Admin endpoints
    path("admin/stats/", views.admin_stats, name="admin_stats"),
    path("admin/users/", views.admin_users, name="admin_users"),
    path(
        "admin/users/<int:user_id>/", views.admin_delete_user, name="admin_delete_user"
    ),
    path("admin/badges/", views.admin_badges, name="admin_badges"),
    path(
        "admin/badges/<int:badge_id>/",
        views.admin_badge_detail,
        name="admin_badge_detail",
    ),
]
