# AI Career Path Simulator

Interactive web app that generates branching career paths using AI. Users fill a profile, upload a resume, and explore forking scenarios on a D3.js tree — complete with salary predictions, gamification badges, and PDF export.

Final Year Project — Bachelor's in Computer Science.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 + D3.js |
| Backend | Django 6 + Django REST Framework + Token Auth |
| AI | Google Gemini AI (via `google-generativeai`) |
| Database | SQLite (dev) |
| PDF Export | jsPDF + html2canvas |
| Resume Parsing | pypdf + python-docx |

---

## Features

- User registration, login, logout (token-based auth)
- Profile create / edit / view
- **Resume upload** — parses PDF/DOCX and auto-fills skills
- **AI-generated career paths** using Gemini, based on the user's profile
- **Interactive D3.js branching tree** with zoom, pan, and hover tooltips
- **Fork-point exploration** — click any node to see 3 next-step options
- Save & reload multiple career paths
- **PDF export** of the current career tree
- Gamification: badges, progress tracking, level system
- Admin panel: user management + badge CRUD + stats dashboard

---

## Project Structure

```
ai-career-path-simulator/
├── career_path_backend/      # Django project
│   ├── api/                  # Main app (models, views, serializers, urls)
│   │   ├── gemini_service.py # Gemini AI integration
│   │   └── resume_parser.py  # PDF/DOCX parsing
│   ├── career_path_backend/  # Django settings
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
└── frontend/                 # React + Vite app
    ├── src/
    │   ├── api/              # Axios client with token interceptor
    │   ├── components/       # Reusable UI kit
    │   └── pages/            # Auth, dashboard, admin, homepage
    ├── .env.example
    └── package.json
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Gemini API key (free) — get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd career_path_backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # Mac / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # copy manually on Windows if needed
# then edit .env and paste your real GEMINI_API_KEY

# Run migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Start the backend server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### 2. Frontend

Open a **new terminal** (keep backend running):

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env            # copy manually on Windows if needed

# Start dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Environment Variables

### Backend — `career_path_backend/.env`

```
SECRET_KEY=change-me-to-a-random-string
DEBUG=True
GEMINI_API_KEY=your-gemini-api-key-here
```

If `GEMINI_API_KEY` is missing, the backend falls back to built-in mock data so the UI still works for demos.

### Frontend — `frontend/.env`

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Career Path Simulator
VITE_VERSION=1.0.0
```

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Login, returns token |
| POST | `/api/auth/logout/` | Invalidate token |
| GET / POST / PUT | `/api/profile/` | Get / create / update profile |
| POST | `/api/profile/upload-resume/` | Parse resume, return skills |
| POST | `/api/simulator/generate/` | Gemini generates a new path |
| POST | `/api/simulator/fork/` | Fetch fork options for a node |
| POST | `/api/simulator/select-fork/` | Record a fork decision |
| GET | `/api/simulator/saved-paths/` | List saved paths |
| POST | `/api/simulator/save-path/` | Save current path |
| GET | `/api/simulator/path/<id>/` | Load a saved path |
| DELETE | `/api/simulator/delete-path/<id>/` | Delete a saved path |
| GET | `/api/gamification/badges/` | List all badges with earned status |
| GET | `/api/gamification/progress/` | Get user's progress stats |
| GET | `/api/admin/stats/` | Admin dashboard stats |
| GET | `/api/admin/users/` | List users (admin only) |
| GET / POST / PUT / DELETE | `/api/admin/badges/...` | Badge CRUD (admin only) |

---

## How the AI Works

1. User fills profile (skills, education, experience, desired field).
2. Frontend calls `/api/simulator/generate/`.
3. Backend sends profile to Gemini with a structured prompt asking for a root career node with children.
4. Gemini returns JSON containing `jobTitle`, `salary`, `timeline`, `description`.
5. The returned tree is rendered with D3.js.
6. Clicking any node calls `/api/simulator/fork/`, which asks Gemini for 3 next-step options based on that node + the user's profile.
7. The selected fork is appended to the tree on the frontend.

If the Gemini API key is missing or rate-limited, the service returns mock data so the UI keeps working.

---

## Default Test Flow

1. Open `http://localhost:5173` → Register → Login.
2. Complete your Profile (optionally upload a resume to auto-fill skills).
3. Go to **Simulator** → click **Generate Path**.
4. Explore the tree — zoom, pan, hover for details.
5. Click any node → pick a fork option → watch the tree grow.
6. Click **Save Path** to persist it.
7. Click **Export PDF** to download your path.
8. Check **Achievements** to see earned badges.
9. Admin: login with superuser account at `/admin/login` to manage users & badges.

---

## License

FYP project — educational use.
