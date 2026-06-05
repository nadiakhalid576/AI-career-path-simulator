# AI Career Path Simulator — Full Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Backend Documentation](#5-backend-documentation)
6. [Frontend Documentation](#6-frontend-documentation)
7. [API Reference](#7-api-reference)
8. [Database Schema](#8-database-schema)
9. [Authentication Flow](#9-authentication-flow)
10. [AI Integration](#10-ai-integration)
11. [Gamification System](#11-gamification-system)
12. [Pakistan Career-Field Coverage](#12-pakistan-career-field-coverage)
13. [Field-Awareness Fix (April 2026)](#13-field-awareness-fix-april-2026)
14. [Operations & Logging](#14-operations--logging)

---

## 1. Project Overview

**AI Career Path Simulator** is a full-stack web application that helps students plan their career paths using AI-generated visualizations. Users create a profile, and the system uses Google's Gemini AI to generate an interactive career tree. Users can explore branches, fork decision points, save paths, and export them as PDFs.

### Key Features

- **AI-Powered Career Paths** — Generates personalized career trees based on user profile (skills with proficiency levels, education, experience, desired field, location, salary expectation).
- **Pakistan-Specific Guidance** — All salaries in PKR/month, 16 supported career fields, references to PMDC/PEC/ICAP/ICMAP and city-specific job-market notes.
- **Interactive Tree Visualization** — D3.js tree with pan, zoom, fit-all, reset-view, and a hover tooltip showing salary, sector, growth potential, and confidence score.
- **Skill-Gap Analysis** — Each node compares its `requiredSkills` (with levels) against the user's `skills_with_levels` and surfaces met vs missing skills inline.
- **Resume Parsing** — Upload PDF/DOCX (≤2 MB) to auto-extract education, years of experience, current job, suggested desired fields, and a `skills_with_levels` map.
- **Fork & Explore** — Click any node to receive 3 strategic next-step options or to regenerate that node's entire subtree with custom edits.
- **Save / Load / Delete / Export** — Save paths, reopen from the dashboard via deep-link, or export as a landscape A4 PDF.
- **Gamification** — Earn badges in 4 categories (explorer, decision, planner, specialist), track level/progress, view achievements.
- **Admin Panel** — Manage users (delete non-superusers), configure badges (full CRUD), view platform-wide stats.

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 7.2 | Build tool & dev server |
| Tailwind CSS | 4.1 | Utility-first CSS |
| D3.js | 7.9 | Tree visualization |
| lucide-react | 0.562 | Icon library |
| axios | 1.13 | HTTP client |
| react-router-dom | 7.12 | Client-side routing |
| jsPDF | 4.2 | PDF generation |
| html2canvas | 1.4 | Canvas capture for PDF |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Django | 6.0 | Web framework |
| Django REST Framework | 3.16 | REST API |
| django-cors-headers | 4.9 | CORS support |
| google-genai | ≥1.0 | Gemini AI SDK (model: `gemini-2.0-flash`) |
| pypdf | 5.1 | PDF text extraction |
| python-docx | 1.1 | DOCX text extraction |
| python-dotenv | 1.2 | Environment variables |

### Database

- **SQLite** (development) — `db.sqlite3`

---

## 3. Project Structure

```
ai-career-path-simulator/
├── career_path_backend/          # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   ├── .env                      # Environment variables (create manually)
│   ├── career_path_backend/      # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── api/                      # Main API app
│       ├── models.py             # Database models
│       ├── views.py              # API view functions
│       ├── serializers.py        # DRF serializers
│       ├── urls.py               # API URL routing
│       ├── gemini_service.py     # Gemini AI integration
│       ├── resume_parser.py      # Resume text extraction
│       ├── admin.py              # Django admin config
│       └── migrations/           # Database migrations
│
├── frontend/                     # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx               # Root component with routes
│       ├── main.jsx              # React entry point
│       ├── index.css             # Global styles & CSS variables
│       ├── api/
│       │   └── api.js            # Axios instance & interceptors
│       ├── components/
│       │   ├── Alert.jsx         # Alert component
│       │   ├── Badge.jsx         # Badge display component
│       │   ├── Button.jsx        # Button component
│       │   ├── Card.jsx          # Card component
│       │   ├── Divider.jsx       # Divider component
│       │   ├── Dropdown.jsx      # Select dropdown component
│       │   ├── Input.jsx         # Text input component
│       │   ├── Loading.jsx       # Loading spinner component
│       │   ├── Modal.jsx         # Modal dialog component
│       │   ├── Progressbar.jsx   # Progress bar component
│       │   ├── Toast.jsx         # Toast notification component
│       │   └── layout/
│       │       ├── Navbar.jsx    # Top navigation bar
│       │       └── Footer.jsx    # Page footer
│       └── pages/
│           ├── auth/
│           │   ├── Login.jsx         # User login
│           │   ├── Register.jsx      # User registration
│           │   └── ProtectedRoute.jsx # Auth guard wrapper
│           ├── dashboard/
│           │   ├── Dashboard.jsx     # Main dashboard
│           │   ├── Profile.jsx       # Profile create/view/edit
│           │   ├── Simulator.jsx     # Career tree simulator
│           │   └── Achievements.jsx  # Badge achievements
│           ├── homepage/
│           │   └── Homapage.jsx      # Landing page
│           └── admin/
│               ├── AdminLogin.jsx     # Admin login
│               ├── AdminDashboard.jsx # Admin dashboard + AdminNav
│               ├── AdminUsers.jsx     # User management
│               └── AdminBadges.jsx    # Badge management
│
├── TESTING_GUIDE.md              # Manual testing instructions
└── FULL_DOCUMENTATION.md         # This file
```

---

## 4. Setup & Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
# Navigate to backend directory
cd career_path_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with the following contents:
![1777957228453](image/FULL_DOCUMENTATION/1777957228453.png)-key
# DEBUG=True
# GEMINI_API_KEY=your-gemini-api-key

# Run migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables

**Backend** (`career_path_backend/.env`):

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes |
| `DEBUG` | Debug mode (`True`/`False`) | No (defaults to `True`) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes (falls back to mock data without it) |

**Frontend** (`.env` in `frontend/`):

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

---

## 5. Backend Documentation

### Django Apps

- **`api`** — The single app handling all API logic (auth, profile, simulator, gamification, admin)

### Key Files

| File | Responsibility |
|------|---------------|
| `views.py` | All API endpoint view functions |
| `models.py` | 5 database models (Profile, CareerPath, Badge, UserBadge, Progress) |
| `serializers.py` | DRF serializers for request validation and response formatting |
| `urls.py` | URL routing for all 23 API endpoints |
| `gemini_service.py` | Gemini AI integration — career path & fork generation |
| `resume_parser.py` | PDF/DOCX text extraction and skill parsing |

### Standard API Response Format

All views use a standard response wrapper:

```python
def api_response(success, data=None, message="", error=None, status_code=200):
    # Returns: {"success": bool, "data": ..., "message": str, "error": str}
```

### Badge Auto-Awarding

The `check_and_award_badges(user, progress)` function runs after key actions (path generation, saving, forking). It checks all badges against the user's progress and awards any newly earned badges.

---

## 6. Frontend Documentation

### Routing

| Path | Component | Auth Required | Description |
|------|-----------|--------------|-------------|
| `/` | Homepage | No | Landing page |
| `/login` | Login | No | User login |
| `/register` | Register | No | User registration |
| `/dashboard` | Dashboard | Yes | Main dashboard with stats and saved paths |
| `/profile` | Profile | Yes | Create/view/edit profile |
| `/simulator` | Simulator | Yes | Career tree visualization |
| `/achievements` | Achievements | Yes | Badge achievements |
| `/admin/login` | AdminLogin | No | Admin login |
| `/admin/dashboard` | AdminDashboard | Admin | Admin stats and overview |
| `/admin/users` | AdminUsers | Admin | User management |
| `/admin/badges` | AdminBadges | Admin | Badge management |

### Authentication State

- `authToken` in localStorage — user authentication token
- `username` in localStorage — display name
- `userId` in localStorage — user ID
- `adminToken` / `adminUser` / `isAdmin` in localStorage — admin authentication

### Shared Components

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `fullWidth`, `onClick`, `children` | Styled button with variants: default, outlined, ghost |
| `Input` | `label`, `type`, `value`, `onChange`, `placeholder` | Labeled text input |
| `Dropdown` | `label`, `value`, `onChange`, `options` | Select dropdown |
| `Modal` | `title`, `onClose`, `children` | Overlay modal dialog |
| `Toast` | `message`, `type`, `onClose` | Auto-dismissing notification |
| `Loading` | `message` | Centered loading spinner |
| `Card` | `children`, `className` | Styled card container |
| `Alert` | `type`, `message` | Inline alert banner |
| `Badge` | `children` | Small badge label |
| `Progressbar` | `value`, `max` | Progress bar |
| `Divider` | — | Horizontal divider |

### D3 Tree Visualization (Simulator)

The Simulator uses D3.js to render an interactive career tree:

1. **Tree layout** — `d3.tree()` computes node positions from hierarchical data
2. **Zoom behavior** — `d3.zoom()` allows panning and zooming the canvas
3. **Node rendering** — Circles with 2-letter initials, colored by depth
4. **Link rendering** — Curved paths connecting parent-child nodes
5. **Click interaction** — Clicking a leaf node triggers fork generation
6. **Tooltip** — Hover to see role details (salary, timeline, difficulty)

---

## 7. API Reference

Base URL: `http://localhost:8000/api`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | No | Register new user |
| POST | `/auth/login/` | No | Login, returns token |
| POST | `/auth/logout/` | Token | Logout, deletes token |

**Register Request Body:**
```json
{ "username": "string", "email": "string", "password": "string", "password_confirm": "string" }
```

**Login Request Body:**
```json
{ "username": "string", "password": "string" }
```

**Login Response:**
```json
{ "success": true, "data": { "token": "string", "user_id": 1, "username": "string" } }
```

### Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile/` | Token | Get user profile |
| POST | `/profile/` | Token | Create profile |
| PUT | `/profile/` | Token | Update profile (partial allowed) |
| POST | `/profile/upload-resume/` | Token | Upload resume file (multipart/form-data) |

**Profile Request Body:**
```json
{
  "full_name": "string",
  "education_level": "Bachelor's",
  "current_job": "string",
  "skills": "Python, JavaScript, React",
  "skills_with_levels": { "Python": "expert", "React": "intermediate" },
  "years_experience": 2,
  "desired_field": "Technology & IT",
  "salary_expectation": "120,000 – 200,000 PKR/month",
  "location": "Karachi"
}
```

`skills_with_levels` is the **primary** skill data structure — values must be one of `basic | intermediate | expert`. The legacy `skills` text is auto-synced.

**Resume Upload Response:**
```jsonc
{
  "success": true,
  "data": {
    "skills": ["python", "react"],
    "skills_count": 2,
    "skills_string": "python, react",
    "skills_with_levels": { "python": "basic", "react": "basic" },
    "profile_patch": {
      "education_level": "Bachelor's",
      "years_experience": 2,
      "current_job": "Software Engineer",
      "desired_field_suggestions": ["Frontend Engineering", "Backend Engineering"]
    },
    "confidence": { "education_level": 0.82, "skills": 0.82, "...": 0 },
    "unresolved_fields": []
  }
}
```

### Simulator Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/simulator/generate/` | Token | Generate AI career path |
| POST | `/simulator/regenerate-subtree/` | Token | Re-expand one node's subtree with optional edits |
| POST | `/simulator/fork/` | Token | Get 3 fork options for a node |
| POST | `/simulator/select-fork/` | Token | Record a fork selection (bumps Progress) |
| GET | `/simulator/saved-paths/` | Token | List user's saved paths |
| POST | `/simulator/save-path/` | Token | Save current path |
| DELETE | `/simulator/delete-path/<id>/` | Token | Delete a saved path |
| GET | `/simulator/path/<id>/` | Token | Load a specific saved path |

**Generate** — No body needed (uses user's profile data).

Response shape:

```jsonc
{
  "success": true,
  "data": {
    "rootNode": { "id": "...", "jobTitle": "...", "careerField": "...", "children": [ ... ] },
    "metadata": {
      "branchCount": 5,
      "generatedLevels": 4,
      "generationMode": "staged",
      "desiredField": "Medicine & Healthcare"
    }
  }
}
```

**Fork Request Body:**

```json
{ "node": { "id": "node_xxx", "jobTitle": "...", "salary": 120000, "careerField": "..." } }
```

**Regenerate Subtree Request Body:**

```json
{
  "treeData":   { "rootNode": { "...": "..." } },
  "selectedNode": { "id": "node_xxx", "...": "..." },
  "nodeUpdates":  { "jobTitle": "Resident Cardiologist", "salary": 220000, "timeline": "In 3 years", "description": "..." }
}
```

**Save Path Request Body:**

```json
{ "pathName": "string", "treeData": { "rootNode": { } }, "decisionsCount": 3 }
```

### Gamification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/gamification/badges/` | Token | Get all badges with user's earned status |
| GET | `/gamification/progress/` | Token | Get user progress stats |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/login/` | No | Admin login (must be superuser) |
| GET | `/admin/stats/` | Admin | Platform statistics |
| GET | `/admin/users/` | Admin | List all users |
| DELETE | `/admin/users/<id>/` | Admin | Delete a user |
| GET | `/admin/badges/` | Admin | List all badges |
| POST | `/admin/badges/` | Admin | Create a badge |
| PUT | `/admin/badges/<id>/` | Admin | Update a badge |
| DELETE | `/admin/badges/<id>/` | Admin | Delete a badge |

---

## 8. Database Schema

### Profile

| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| user | OneToOneField → User | Linked Django user |
| full_name | CharField(100) | Display name |
| education_level | CharField(50) | High School / Bachelor's / Master's / PhD / Other |
| current_job | CharField(100) | Current job title |
| skills | TextField | Comma-separated skills |
| years_experience | IntegerField | Years of experience |
| desired_field | CharField(100) | Target career field |
| salary_range | CharField(50) | Optional salary expectation |
| location | CharField(100) | Optional location |
| created_at | DateTimeField | Auto-set on create |
| updated_at | DateTimeField | Auto-set on update |

### CareerPath

| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| user | ForeignKey → User | Owner |
| path_name | CharField(100) | User-given name |
| tree_data | TextField | JSON tree structure |
| decisions_count | IntegerField | Number of fork decisions made |
| created_at | DateTimeField | Auto-set on create |
| updated_at | DateTimeField | Auto-set on update |

### Badge

| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| name | CharField(100) | Badge name |
| description | TextField | What it represents |
| icon | CharField(50) | Emoji icon |
| requirements | TextField | Description of requirements |
| category | CharField(50) | explorer / decision / planner / specialist |
| points_required | IntegerField | Threshold for awarding |
| created_at | DateTimeField | Auto-set on create |

### UserBadge

| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| user | ForeignKey → User | User who earned it |
| badge | ForeignKey → Badge | The badge earned |
| earned_at | DateTimeField | When it was earned |

Unique constraint: `(user, badge)` — each user can earn each badge only once.

### Progress

| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| user | OneToOneField → User | Linked user |
| paths_explored | IntegerField | Total paths generated |
| decisions_made | IntegerField | Total fork decisions |
| total_time_spent | IntegerField | Minutes spent (tracked) |
| level | IntegerField | Calculated level |
| created_at | DateTimeField | Auto-set on create |
| updated_at | DateTimeField | Auto-set on update |

**Level formula:** `level = ((paths_explored × 10) + (decisions_made × 5)) ÷ 100 + 1`

---

## 9. Authentication Flow

### User Authentication

1. User registers via `/auth/register/` → account created
2. User logs in via `/auth/login/` → receives a DRF Token
3. Token stored in `localStorage.authToken`
4. Axios interceptor attaches `Authorization: Token <token>` to every API request
5. Backend validates token via `@permission_classes([IsAuthenticated])`
6. On logout, token is deleted server-side and cleared from localStorage

### Admin Authentication

1. Admin logs in via `/admin/login/` (must be a Django superuser)
2. Token stored in `localStorage.adminToken`, `isAdmin=true`
3. Admin pages check `localStorage.isAdmin` on mount, redirect to `/admin/login` if missing
4. Admin API endpoints use `IsAdminUser` permission

### Protected Routes

The `ProtectedRoute` component wraps authenticated pages. If no `authToken` exists in localStorage, it redirects to `/login`.

---

## 10. AI Integration

### Gemini Service

Located in `gemini_service.py`. Uses Google's `gemini-2.0-flash` model via the `google-genai` SDK.

**Career Path Generation (`generate_career_path`):**

Two-stage staged generation:

1. **Top-level branches** (`_generate_top_branches`) — produces ≥ 5 *distinct* strategic directions inside the user's `desired_field`. Each branch is normalised into the canonical node shape via `_normalize_node`.
2. **Recursive child expansion** (`_expand_branch_recursive` → `_generate_children`) — expands every branch to depth 4, with 2 children per node per call. Children inherit the parent's `careerField` so the tree never drifts out of the user's chosen field.

The root node is built by `_build_root_title`:

* If `current_job` already aligns with `desired_field` → use `current_job`.
* Else → display a transition title `"<current_job> → <desired_field>"`.
* If only `desired_field` is set → `"Aspiring <field> Professional"`.

Every prompt is prefixed with `PAKISTAN_CONTEXT` (PKR salary bands, 16 supported fields, regional notes, key regulators) and includes hard rules forbidding the LLM from drifting toward Software Engineering when the user's field is something else.

**Fork Generation (`generate_fork_options`):**

Returns 3 distinct next-step options for a specific node, each with `optionName`, `jobTitle`, `salary`, `timeline`, `description`, `requiredSkills` (with levels), `sector`, `likelihood`, and `confidenceScore`. Options stay inside the parent's `careerField`.

**Subtree Regeneration (`regenerate_subtree`):**

Re-expands a selected node with the user's optional edits (`nodeUpdates`) applied first, then walked through `_expand_branch_recursive`. The view function then calls `replace_node_subtree` to splice the new subtree into the saved tree at the matching `id`.

### Canonical Node Shape

```jsonc
{
  "id": "node_<hex>",
  "jobTitle": "Senior Cardiologist",
  "salary": 350000,
  "timeline": "In 3 years",
  "description": "Lead cardiac care at a tertiary hospital ...",
  "careerField": "Medicine & Healthcare",
  "requiredSkills": [
    { "name": "Echocardiography", "level": "expert" },
    { "name": "Patient Communication", "level": "intermediate" }
  ],
  "matchScore": 82,
  "confidenceScore": 78,
  "skillGapCount": 1,
  "sector": "Private",
  "growthPotential": "High",
  "levelIndex": 2,
  "children": [ /* recursive */ ]
}
```

### Mock Data Fallback

When `GEMINI_API_KEY` is missing, the API returns an error, or the JSON response is invalid, the service falls back to **field-aware** deterministic mocks:

* `_mock_top_branches` resolves the user's desired field via `_resolve_taxonomy` (case + punctuation insensitive). The taxonomy now covers all 16 frontend fields. If the field is still unresolved, the mock builds a **field-named generic taxonomy** (`"Junior <field> Professional"`, `"<field> Specialist"`, …) instead of silently defaulting to Technology & IT.
* `_user_skill_subset` seeds `requiredSkills` from the user's actual `skills_with_levels`, so two users in the same field but with different skill stacks get visibly different requirement chips.
* `_mock_children` and `get_mock_fork_options` carry `careerField` forward so child nodes and fork options never drift out of the user's chosen field.

All Gemini failures are logged via `logging` (`logger.exception` / `logger.warning`) so an operator can see exactly when the API drops to mocks.

---

## 11. Gamification System

### Badges

Badges are admin-configured achievements. Each badge has:
- A **category** (explorer, decision, planner, specialist)
- A **points threshold** (`points_required`)
- An **emoji icon** for display

### Auto-Awarding

After path generation, saving, and forking, the system calls `check_and_award_badges()`. It:
1. Loads all badges and the user's already-earned badge IDs
2. For each unearned badge, checks if the user's progress meets the criteria
3. Awards matching badges by creating `UserBadge` records

### Progress Tracking

The `Progress` model tracks:
- `paths_explored` — incremented when a path is generated
- `decisions_made` — incremented when a fork is selected
- `level` — calculated from the formula above

### Level System

Levels are calculated automatically:

| Level | Points Needed | Example Activity |
|-------|--------------|-----------------|
| 1 | 0–99 | Getting started |
| 2 | 100–199 | 10 paths explored |
| 3 | 200–299 | 20 paths explored |
| 4 | 300–399 | 30 paths or mix of paths + decisions |

Each path generated = 10 points. Each fork decision = 5 points.

---

## 12. Pakistan Career-Field Coverage

The simulator is intentionally Pakistan-specific. The frontend Profile page exposes 16 career fields, and `gemini_service.py` carries a matching taxonomy with field-appropriate progression tracks, entry salary (PKR/month), and a growth multiplier:

| # | Field | Sample tracks (entry → senior) | Entry salary (PKR/m) |
|---|---|---|---|
| 1 | Technology & IT | Software Engineer → AI/ML Engineer → Cybersecurity Analyst → Data Scientist → DevOps | 60,000 |
| 2 | Medicine & Healthcare | House Officer → Medical Officer → Specialist → Surgeon → Dentist | 80,000 |
| 3 | Engineering | Junior → Site → Project → Senior → Principal Engineer | 55,000 |
| 4 | Business & Commerce | Accounts Officer → Finance Analyst → CA Trainee → Manager Finance → CFO | 50,000 |
| 5 | Law & Legal | Junior Advocate → Senior Advocate → Corporate Counsel → Partner → Additional Judge | 40,000 |
| 6 | Education & Teaching | School Teacher → Senior Teacher → HoD → VP → Principal/Lecturer | 35,000 |
| 7 | Government & Civil Services | AC → DC → Additional Commissioner → Commissioner → Secretary | 60,000 |
| 8 | Banking & Finance | Junior Officer → Branch Manager Trainee → Relationship Manager → Senior Manager → VP/SVP | 55,000 |
| 9 | Media & Journalism | Reporter → Senior Reporter → Sub-Editor → Editor → News Director | 35,000 |
| 10 | Arts, Design & Creative | Junior Designer → Graphic Designer → Senior Designer → Art Director → Creative Director | 40,000 |
| 11 | Agriculture | Agricultural Officer → Field Supervisor → Farm Manager → Agri Consultant → Agri Business Director | 40,000 |
| 12 | Sciences & Research | Research Assistant → Research Officer → Senior Research Officer → Principal Scientist → Director Research | 45,000 |
| 13 | Social Sciences | Program Officer (NGO) → M&E Officer → Project Coordinator → Program Manager → Country Director | 45,000 |
| 14 | Military & Defense | Cadet Officer → Captain → Major → Lt. Colonel → Colonel/Brigadier | 70,000 |
| 15 | Real Estate | Property Consultant → Senior Sales Executive → Branch Manager → Regional Manager → Director Real Estate | 45,000 |
| 16 | Hospitality & Tourism | Front Desk Associate → Guest Relations Officer → F&B Supervisor → Operations Manager → General Manager | 40,000 |

Field lookup is **case- and punctuation-insensitive** thanks to `_resolve_taxonomy` — strings like `"Medicine/Healthcare"`, `"medicine and healthcare"`, and `"Medicine & Healthcare"` all map to the canonical entry.

---

## 13. Field-Awareness Fix (April 2026)

### The bug the client reported

> "No matter what skill or career I select, the simulator outputs Software Developer paths."

### Why it was happening (multiple compounding causes)

1. **Mock fallback was Tech-biased.** `_mock_top_branches` did a case-sensitive exact-match on `desired_field` and defaulted to `PAKISTAN_CAREER_TAXONOMY["Technology & IT"]` for anything that did not match. Three of the 16 frontend fields had **no taxonomy entry at all** — Military & Defense, Real Estate, Hospitality & Tourism — so they always degraded to Software Engineer.
2. **Silent Gemini failures.** When the LLM call errored or returned invalid JSON, the code dropped to the same Tech-defaulting mock and only printed a stack trace. The user couldn't tell the AI was failing.
3. **Root node always used `current_job`.** If a user typed "Software Developer" once and later switched `desired_field` to Medicine, the tree's root was still labelled "Software Developer". This reinforced the impression the field choice was being ignored.
4. **Generic mock skills.** Mock branches always asked for "Communication Skills" / "Problem Solving" regardless of the user's actual `skills_with_levels`, so two profiles in the same field looked nearly identical.
5. **Soft prompts.** The Gemini prompts mentioned `desired_field` but did not strictly forbid drifting back to Software/Technology, so the LLM occasionally produced tech-flavoured branches anyway.

### The fix (committed)

- **`PAKISTAN_CAREER_TAXONOMY` now covers all 16 frontend fields.** New entries: Military & Defense (Cadet → Brigadier), Real Estate (Property Consultant → Director), Hospitality & Tourism (Front Desk → General Manager).
- **`_normalize_field_key` + `_resolve_taxonomy`** added in `gemini_service.py` for case- and punctuation-insensitive lookup. If a custom field still cannot be resolved, the mock builds a **field-named generic taxonomy** (`"Junior <field> Professional"` …) instead of silently defaulting to Tech.
- **`_mock_top_branches` seeds `requiredSkills` from the user's real skills**, so two profiles produce visibly different requirement chips.
- **`_build_root_title` produces transition titles** like `"Software Developer → Medicine & Healthcare"` when `current_job` and `desired_field` disagree.
- **Top-level branches inherit `desired_field`** if Gemini omits `careerField`, locking the tree inside the user's chosen field.
- **Prompts rewritten with CRITICAL RULES** that explicitly forbid pivoting to Software/Technology unless that *is* the user's field, and that require the LLM to leverage the user's listed skills.
- **`generate_fork_options` carries `careerField` forward** to the mock, so the fork modal stays inside the user's field even when AI is unavailable.
- **All Gemini failures now use `logging`** — `logger.exception(...)` for errors, `logger.warning(...)` for empty branches or missing API key — replacing the previous silent `print` statements.

### Verifying the fix

```python
from api.gemini_service import _resolve_taxonomy, _mock_top_branches

assert _resolve_taxonomy("technology and IT")[0] == "Technology & IT"
assert _resolve_taxonomy("Medicine/Healthcare")[0] == "Medicine & Healthcare"
assert _resolve_taxonomy("Hospitality & Tourism")[0] == "Hospitality & Tourism"

profile = {
    "desired_field": "Law & Legal",
    "current_job": "Software Developer",
    "skills_with_levels": {"Drafting": "expert", "Negotiation": "intermediate"},
}
branches = _mock_top_branches(profile)
assert all(b["careerField"] == "Law & Legal" for b in branches)
assert any("Drafting" in (s.get("name") if isinstance(s, dict) else s)
           for b in branches for s in b["requiredSkills"])
```

### What the user will now see

- Selecting **Medicine & Healthcare** as the desired field produces a medical career tree (House Officer → Medical Officer → Specialist → …) — never Software Engineer.
- The root node reads `"Software Developer → Medicine & Healthcare"` so the user immediately sees that the tree reflects the desired transition.
- Skill chips on each node reference the user's actual skills, not generic placeholders.
- If Gemini is rate-limited or down, the fallback still respects the chosen field — and a `WARNING` line appears in the Django log so the operator can see why.

---

## 14. Operations & Logging

- The Gemini SDK is initialised lazily once per process (`_gemini_client` global). If `GEMINI_API_KEY` is empty, every AI call short-circuits to mocks **and emits a warning** with the user's `desired_field` for traceability.
- All exception paths use `logger.exception(...)` so the full traceback is captured.
- Recommended Django logging snippet for production (`settings.py`):

  ```python
  LOGGING = {
      "version": 1,
      "disable_existing_loggers": False,
      "handlers": {
          "console": {"class": "logging.StreamHandler"},
      },
      "loggers": {
          "api.gemini_service": {"handlers": ["console"], "level": "INFO"},
      },
  }
  ```

- For production, switch `DEBUG=False`, set `ALLOWED_HOSTS`, replace SQLite with Postgres, tighten `CORS_ALLOW_ALL_ORIGINS`, and move `GEMINI_API_KEY` into your secret manager.
- The DRF token header format is `Authorization: Token <token>` (not `Bearer`).
