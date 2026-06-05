# Backend — Detailed Documentation

> **Audience:** Developers and the documentation/report writer.
> This document explains every module, model, endpoint and AI service in the
> Django backend so the documentation person can write or restructure any
> chapter (system design, database, API, AI engine, testing) without
> re-reading the source.

---

## 1. Technology Stack

| Concern | Technology |
|---------|-----------|
| Framework | **Django** + **Django REST Framework (DRF)** |
| Auth | DRF **TokenAuthentication** (`rest_framework.authtoken`) |
| Database | **SQLite** (`db.sqlite3`) — dev default |
| CORS | `django-corsheaders` |
| AI providers | **Google Gemini** (primary) → **xAI Grok** (fallback) → deterministic mock |
| Resume parsing | `pypdf` (PDF), `python-docx` (DOCX) |
| Config | `.env` via `python-dotenv` |

App layout:

```
career_path_backend/
├── manage.py
├── requirements.txt
├── career_path_backend/        # Django project (settings, urls, wsgi/asgi)
│   ├── settings.py
│   └── urls.py
└── api/                        # The single application
    ├── models.py               # Database models
    ├── serializers.py          # DRF serializers / validation
    ├── views.py                # All API endpoints (function-based)
    ├── urls.py                 # API route table
    ├── gemini_service.py       # AI career-tree engine + fallbacks
    ├── resume_parser.py        # PDF/DOCX resume extraction
    ├── admin.py / apps.py
    └── migrations/
```

---

## 2. Project Configuration (`career_path_backend/settings.py`)

- `SECRET_KEY`, `DEBUG`, host list read from environment (`.env`).
- `ALLOWED_HOSTS`: localhost + 127.0.0.1 (+ Vite dev ports).
- **Installed apps:** Django defaults + `rest_framework`,
  `rest_framework.authtoken`, `corsheaders`, local `api`.
- **DRF defaults:** authentication = `TokenAuthentication`; default permission
  = `IsAuthenticated` (each view overrides as needed with `AllowAny` /
  `IsAdminUser`).
- **CORS:** `CORS_ALLOW_ALL_ORIGINS = True` (development), explicit
  `CORS_ALLOWED_ORIGINS` for Vite/React dev ports, credentials allowed.
- **Database:** SQLite file at `BASE_DIR/db.sqlite3`.

> ⚠️ For production the report should note: disable `DEBUG`, set a real
> `SECRET_KEY`, restrict CORS, and move off SQLite.

---

## 3. Database Models (`api/models.py`)

### 3.1 `Profile` (1-to-1 with `User`)
Stores the career profile that drives the AI.

| Field | Type | Notes |
|-------|------|-------|
| `user` | OneToOne(User) | `related_name="profile"` |
| `full_name` | Char(100) | |
| `education_level` | Char(50) | choices: High School / Bachelor's / Master's / PhD / Other |
| `current_job` | Char(100) | |
| `skills` | Text | legacy comma-separated skills |
| `skills_with_levels` | JSON | `{skill: basic\|intermediate\|expert}` |
| `years_experience` | Int | default 0 |
| `desired_field` | Char(100) | drives tree generation |
| `salary_expectation` | Char(80) | optional |
| `salary_range` | Char(50) | optional |
| `location` | Char(100) | optional |
| `created_at` / `updated_at` | DateTime | auto |

### 3.2 `CareerPath` (FK → User)
A saved career tree.

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK(User) | `related_name="career_paths"` |
| `path_name` | Char(100) | |
| `tree_data` | Text | JSON tree serialized as a string |
| `decisions_count` | Int | |
| `created_at` / `updated_at` | DateTime | |

Helper methods: `get_tree_data()` / `set_tree_data()` (JSON ↔ string).

### 3.3 `Badge`
A configurable achievement.

| Field | Type | Notes |
|-------|------|-------|
| `name`, `description`, `requirements` | text | |
| `icon` | Char(50) | emoji, default 🏆 |
| `category` | Char(50) | choices: `explorer` / `decision` / `planner` / `specialist` |
| `points_required` | Int | threshold (meaning depends on category) |

### 3.4 `UserBadge` (FK → User, FK → Badge)
Join table of earned badges. `unique_together = (user, badge)` + `earned_at`.

### 3.5 `Progress` (1-to-1 with `User`)
Gamification counters.

| Field | Type | Notes |
|-------|------|-------|
| `paths_explored` | Int | +1 per generated path |
| `decisions_made` | Int | +1 per fork/regenerate |
| `total_time_spent` | Int | minutes (reserved) |
| `level` | Int | from `calculate_level()` |

`calculate_level()`: `total = paths_explored*10 + decisions_made*5`,
`level = total // 100 + 1`.

---

## 4. Serializers (`api/serializers.py`)

| Serializer | Purpose / notable behaviour |
|-----------|------------------------------|
| `EmptyToZeroIntegerField` | Custom field: `""`/`None` → `0` (used for `years_experience`). |
| `UserSerializer` | id, username, email, first/last name. |
| `RegisterSerializer` | Validates `password == confirm_password`, `password` ≥ 8; `create()` makes the user **and** an empty `Progress` row. |
| `LoginSerializer` | username + password. |
| `ProfileSerializer` | Optional/blank-tolerant fields; `validate_skills_with_levels` enforces levels ∈ {basic, intermediate, expert}; on partial update drops empty strings so a PUT can't wipe existing values; **back-compat sync** — derives `skills_with_levels` from legacy `skills` text and vice-versa. |
| `CareerPathSerializer` / `CareerPathListSerializer` | Full vs. list (no `tree_data`) views of saved paths. |
| `BadgeSerializer` | Adds `is_earned` + `earned_at` per requesting user (via `context['user']`). |
| `ProgressSerializer` | Adds `badges_earned` + `total_badges`. |
| `AdminUserSerializer` | Adds nested `profile` + `paths_count`. |
| `AdminBadgeSerializer` | Adds `earned_count`. |

---

## 5. API Endpoints (`api/urls.py` + `api/views.py`)

All routes are prefixed with `/api/`. Every response uses the standard
envelope from the `api_response()` helper:

```json
{ "success": true|false, "data": {...}, "message": "...", "error": "..." }
```

### 5.1 Auth

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/auth/register/` | AllowAny | Create user + token; rejects invalid serializer. |
| POST | `/auth/login/` | AllowAny | Authenticate; **staff/superuser blocked here** (must use admin portal); returns token. |
| POST | `/auth/logout/` | IsAuthenticated | Deletes the user's auth token. |
| POST | `/admin/login/` | AllowAny | Requires `is_staff` **and** `is_superuser`; returns admin token. |

### 5.2 Profile

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/profile/` (`/profile/view/`) | IsAuthenticated | Fetch profile (`404` if none). |
| POST | `/profile/` (`/profile/create/`) | IsAuthenticated | Create profile (errors if one exists). |
| PUT | `/profile/` (`/profile/update/`) | IsAuthenticated | Partial update. |
| POST | `/profile/upload-resume/` | IsAuthenticated | Parse uploaded **PDF/DOCX** resume → skills + profile hints. |

`upload_resume` validation: file must exist, end in `.pdf`/`.docx`, ≤ 2 MB,
and yield extractable text. Returns `skills`, `skills_count`,
`skills_string`, `skills_with_levels`, a `profile_patch`
(education/years/current_job/desired_field suggestions), `confidence` scores
and `unresolved_fields`.

### 5.3 Simulator

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | `/simulator/generate/` | IsAuthenticated | Build full career tree from the user's profile (`generate_career_path`); `paths_explored += 1`, recompute level, award badges. |
| POST | `/simulator/regenerate-subtree/` | IsAuthenticated | Regenerate one node's subtree, preserving the rest (`regenerate_subtree` + `replace_node_subtree`); `decisions_made += 1`. |
| POST | `/simulator/fork/` | IsAuthenticated | Return 3 distinct next-step options for a node. |
| POST | `/simulator/select-fork/` | IsAuthenticated | Record a fork choice; `decisions_made += 1`; award badges. |
| GET | `/simulator/saved-paths/` | IsAuthenticated | List the user's saved paths. |
| POST | `/simulator/save-path/` | IsAuthenticated | Save a tree (`pathName`, `treeData`, `decisionsCount`). |
| DELETE | `/simulator/delete-path/<id>/` | IsAuthenticated | Delete one of the user's paths. |
| GET | `/simulator/path/<id>/` | IsAuthenticated | Fetch one saved path (owner-scoped). |

### 5.4 Gamification

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/gamification/badges/` | IsAuthenticated | All badges with per-user earned status. |
| GET | `/gamification/progress/` | IsAuthenticated | User progress (creates a row if missing). |

### 5.5 Admin (all `IsAdminUser`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats/` | totals + 5 most recent users. |
| GET | `/admin/users/` | All users (with profile + path count). |
| DELETE | `/admin/users/<id>/` | Delete a user (superusers protected). |
| GET / POST | `/admin/badges/` | List / create badges. |
| PUT / DELETE | `/admin/badges/<id>/` | Update / delete a badge. |

### 5.6 Badge auto-award logic (`check_and_award_badges`)
Called after path generation / fork selection / subtree regeneration. For each
not-yet-earned badge, awards it based on `category` and `points_required`:
- `explorer` → `progress.paths_explored`
- `decision` → `progress.decisions_made`
- `planner` → count of saved `CareerPath`s
- `specialist` → `progress.level`

A `points_required` of `0` uses sensible defaults (1 path / 5 decisions /
3 saved / level 5).

---

## 6. AI Career-Tree Engine (`api/gemini_service.py`)

This is the most important module. It generates a **staged** career tree and
is resilient to API failure.

### 6.1 Provider failover with circuit breakers
`_call_llm(prompt)` tries providers in order:
1. **Google Gemini** (`google.genai`, model from `GEMINI_MODEL`, default
   `gemini-2.5-flash`).
2. **xAI Grok** (OpenAI-compatible REST, model from `GROK_MODEL`, default
   `grok-4-fast`).
3. If both fail → deterministic **mock** data so the app never breaks.

Each provider has a **circuit breaker** (`_provider_blocked_until`):
- Transient errors (429/quota/timeout/5xx/network) → 60 s cooldown
  (`_PROVIDER_COOLDOWN_SECONDS`).
- Permanent errors (401/403/bad key/no credits) → blocked for the whole
  session (24 h) and logged **once** to avoid log spam.

Classifiers: `_is_quota_or_network_error`, `_is_permanent_provider_error`,
`_handle_provider_failure`.

### 6.2 Pakistan context
Every prompt is prefixed with `PAKISTAN_CONTEXT` (PKR salary bands, 16 career
fields, city/job-market notes, regulatory bodies) so the AI returns
Pakistan-specific guidance. `PAKISTAN_CAREER_TAXONOMY` provides
field→tracks/salary/growth data for the **mock** fallback;
`_FIELD_SKILL_HINTS` and `_TRACK_SKILL_SEEDS` keep mock skills field-specific
and per-branch distinct. `_resolve_taxonomy` does fuzzy field matching so
`"technology & it"`, `"Tech and IT"`, etc. resolve to the canonical key.

### 6.3 Tree generation flow (`generate_career_path`)
1. Build the **root node** with a smart title from `_build_root_title`
   (shows `Current → Desired` when they differ).
2. `_generate_top_branches` — one LLM call for `TOP_BRANCH_COUNT = 4`
   distinct top-level branches inside the user's desired field; tops up from
   mock if the model returns too few.
3. `_expand_branch_recursive` — recursively `_generate_children` (2 children
   per node, different strategic directions) down to
   `MAX_TREE_DEPTH = 5` (6 visible levels). **This depth constant must stay in
   sync with the frontend Simulator.**
4. Returns `{ rootNode, metadata }` (branch count, levels, mode, desiredField).

Supporting helpers: `_normalize_node` (canonical node shape — id, jobTitle,
salary, timeline, description, careerField, requiredSkills `[{name,level}]`,
matchScore, confidenceScore, skillGapCount, sector, growthPotential,
levelIndex, children), `_clean_job_title` (dedupes repeated words),
`_parse_json_response`/`_clean_json_text` (strip markdown fences safely),
`_coerce_int`.

### 6.4 Other engine entry points
- `regenerate_subtree(profile, selected_node)` — re-expand only the selected
  node's descendants, preserving its identity.
- `replace_node_subtree(tree, node_id, new_subtree)` — splice a regenerated
  subtree back into the saved tree (`(updated_tree, changed)`).
- `generate_fork_options(node, profile)` — 3 distinct next-step options for a
  node (LLM → mock `get_mock_fork_options`).

### 6.5 Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `GEMINI_API_KEY` | — | Google Gemini key (primary). |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model id. |
| `GEMINI_HTTP_TIMEOUT` | `10` | Per-call timeout (s). |
| `XAI_API_KEY` / `GROK_API_KEY` | — | Grok key (fallback). |
| `GROK_MODEL` | `grok-4-fast` | Grok model id. |
| `GROK_BASE_URL` | `https://api.x.ai/v1` | Grok endpoint. |

---

## 7. Resume Parser (`api/resume_parser.py`)

- `extract_text(file, name)` — pulls raw text from PDF (`pypdf`) or DOCX
  (`python-docx`); returns `""` on any failure (never raises to the view).
- `parse_skills(text)` — substring-matches against a curated `COMMON_SKILLS`
  list (languages, web, backend, DB, DevOps, data/AI, mobile, design, soft
  skills).
- `parse_resume_profile(text)` returns:
  - `extracted` — `education_level`, `years_experience`, `current_job`,
    `desired_field_suggestions`, `skills`, `skills_with_levels` (all extracted
    skills default to `"basic"`).
  - `confidence` — heuristic 0–1 score per field.
  - `unresolved_fields` — fields that could not be detected (so the UI can
    prompt the user).
- Detection helpers use keyword/regex heuristics: `_extract_education_level`,
  `_extract_years_experience`, `_extract_current_role`,
  `_extract_desired_fields` (maps skill clusters → suggested fields like
  *Artificial Intelligence*, *Frontend Engineering*, etc.).

---

## 8. Request Lifecycle (example: "Generate a career path")

1. Frontend `POST /api/simulator/generate/` with the auth token.
2. DRF `TokenAuthentication` resolves `request.user`.
3. `generate_path` loads the user's `Profile` (→ 400 if none) and serializes
   it.
4. `generate_career_path(profile_data)` builds the tree via Gemini → Grok →
   mock with circuit-breaker protection.
5. `Progress.paths_explored += 1`, `calculate_level()`, save.
6. `check_and_award_badges` grants any newly-qualified badges.
7. `api_response(True, path_data, ...)` returns the standard envelope; the
   frontend renders it with D3.

---

## 9. Notes for the Report

- **Resilience is a key selling point:** the AI engine degrades gracefully
  (Gemini → Grok → deterministic, field-aware mock) so a demo never fails due
  to quota/network — worth highlighting in the design chapter.
- **Localisation:** all guidance is Pakistan-specific (PKR salaries, local job
  market, regulatory bodies) — a deliberate domain constraint.
- **Security caveats for production:** token-in-localStorage (XSS exposure),
  `CORS_ALLOW_ALL_ORIGINS=True`, `DEBUG=True`, SQLite, and debug `print()`
  statements in `register` should be addressed before deployment.
- **Depth constant coupling:** `MAX_TREE_DEPTH = 5` exists in **both**
  `gemini_service.py` and the frontend `Simulator.jsx`; document them together.
