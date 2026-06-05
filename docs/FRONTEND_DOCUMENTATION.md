# Frontend — Detailed Documentation

> **Audience:** Developers and the documentation/report writer.
> This document explains every feature and module of the React frontend so the
> documentation person can confidently restructure, summarise, or expand any
> chapter (architecture, modules, interfaces, testing) without re-reading the
> source code.

---

## 1. Technology Stack

| Concern | Technology |
|---------|-----------|
| UI library | **React** (function components + hooks) |
| Build tool | **Vite** |
| Routing | **react-router-dom** (`BrowserRouter`) |
| HTTP client | **Axios** (single configured instance) |
| Data viz | **D3.js** (`d3`) — used for the career tree graph |
| PDF export | **jsPDF** + **html2canvas** |
| Icons | **lucide-react** |
| Styling | **Tailwind CSS** (utility classes, gradient theme: indigo → violet) |

There is **no global state library** (no Redux/Context for auth). Session state
lives in `localStorage` and is read directly by the route guards and the Axios
interceptor. `App.jsx` mirrors auth state into component state only so the
Navbar can react to login/logout.

---

## 2. Project Structure

```
frontend/
├── public/
│   └── Logo.png                 # Brand logo (used in Navbar, Footer, auth pages)
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx                 # React entry point
    ├── App.jsx                  # Router + layout + auth state
    ├── index.css / App.css      # Global styles
    ├── api/
    │   └── api.js               # Axios instance + interceptors
    ├── components/              # Reusable UI components
    │   ├── Alert.jsx  Badge.jsx  Button.jsx  Card.jsx  Divider.jsx
    │   ├── Dropdown.jsx  Input.jsx  Loading.jsx  Modal.jsx
    │   ├── Progressbar.jsx  Toast.jsx
    │   └── layout/
    │       ├── Navbar.jsx       # Public/student top nav
    │       └── Footer.jsx       # Site footer
    └── pages/
        ├── homepage/Homapage.jsx
        ├── auth/
        │   ├── Login.jsx  Register.jsx
        │   ├── ProtectedRoute.jsx        # Student route guard
        │   └── AdminProtectedRoute.jsx   # Admin route guard
        ├── dashboard/
        │   ├── Dashboard.jsx  Profile.jsx
        │   ├── Simulator.jsx  Achievements.jsx
        └── admin/
            ├── AdminLogin.jsx  AdminDashboard.jsx
            ├── AdminUsers.jsx  AdminBadges.jsx
```

---

## 3. Routing & Layout (`App.jsx`)

`App.jsx` defines two layout zones:

1. **Admin zone** — `/admin/login`, `/admin/dashboard`, `/admin/users`,
   `/admin/badges`. Rendered **without** Navbar/Footer; admin pages render their
   own shared `AdminNav` bar.
2. **Public/student zone** — everything else (`*`). Wrapped with `<Navbar>` and
   `<Footer>` and an inner `<Routes>`.

Top-level state in `App`:
- `isAuthenticated` — initialised from `!!localStorage.getItem("authToken")`.
- `username` — initialised from `localStorage.getItem("username")`.
- `handleLogin(user)` — sets state after a successful student login.
- `handleLogout()` — calls `POST /auth/logout/`, then `localStorage.clear()` and
  hard-redirects to `/`.

| Route | Component | Guard |
|-------|-----------|-------|
| `/` | HomePage | none |
| `/register` | RegisterPage | none |
| `/login` | LoginPage | none |
| `/dashboard` | DashboardPage | `ProtectedRoute` |
| `/profile` | ProfilePage | `ProtectedRoute` |
| `/simulator` | SimulatorPage | `ProtectedRoute` |
| `/achievements` | AchievementsPage | `ProtectedRoute` |
| `/admin/login` | AdminLogin | none |
| `/admin/dashboard` | AdminDashboard | `AdminProtectedRoute` |
| `/admin/users` | AdminUsers | `AdminProtectedRoute` |
| `/admin/badges` | AdminBadges | `AdminProtectedRoute` |

---

## 4. Authentication Architecture

### 4.1 Two separate auth realms

The system keeps **student** and **admin** sessions completely independent in
`localStorage` so an admin and a student can never collide:

| Realm | Keys |
|-------|------|
| Student | `authToken`, `userId`, `username` |
| Admin | `adminToken`, `adminUser`, `isAdmin` (`"true"`) |

When a student logs in (`Login.jsx`) the admin keys are cleared, and vice-versa
(`AdminLogin.jsx`).

### 4.2 Axios instance (`src/api/api.js`)

- **Base URL:** `import.meta.env.VITE_API_BASE_URL` or
  `http://localhost:8000/api`.
- **Request interceptor:** if the caller did not set an `Authorization` header,
  it attaches `Authorization: Token <token>`. It chooses the **admin** token
  when `localStorage.isAdmin === "true"` *or* the current path starts with
  `/admin`; otherwise the **student** token.
- **Response interceptor:** on HTTP `401` it clears the relevant tokens and
  redirects — admin routes → `/admin/login`, all others → `/login`.

### 4.3 Route guards

- **`ProtectedRoute`** — if `isAdmin === "true"` → `/admin/dashboard`; else if
  no `authToken` → `/login`; otherwise render children.
- **`AdminProtectedRoute`** — if missing `adminToken` or `isAdmin !== "true"`:
  redirect to `/dashboard` (if a student token exists) or `/admin/login`;
  otherwise render children.

### 4.4 API response envelope

All backend responses use `{ success, data, message, error }`. The frontend
consistently reads the payload from `response.data.data`.

---

## 5. Pages — Feature-by-Feature

### 5.1 HomePage (`pages/homepage/Homapage.jsx`)
- **Route:** `/` (public). **State/API:** none.
- Pure marketing page: hero, features grid, stats bar, "How It Works" steps,
  university trust strip, testimonials, final CTA. Content held in local arrays
  (`features`, `steps`, `stats`, `testimonials`, `universities`).
- CTA buttons `navigate("/simulator")` / `navigate("/register")`. An
  unauthenticated "Start Simulation" click funnels through `ProtectedRoute` →
  `/login`.

### 5.2 LoginPage (`pages/auth/Login.jsx`)
- **Route:** `/login` (public). Receives `onLogin` prop.
- **State:** `formData{username,password}`, `loading`, `toast`,
  `showPassword`, `rememberMe` (UI-only, not persisted).
- **API:** `POST /auth/login/` on submit. Reads `response.data.data.{token,user}`.
- **Logic:** on success clears admin keys, stores student keys, calls
  `onLogin`, success toast, then `navigate("/dashboard")` after 1 s. On HTTP
  `403` (admin tried student form) → message + redirect to `/admin/login`.

### 5.3 RegisterPage (`pages/auth/Register.jsx`)
- **Route:** `/register` (public).
- **State:** `formData{username,email,password,confirmPassword}`, `errors`,
  `loading`, `toast`, `showPassword`, `showConfirm`.
- **Client validation (`validate()`):** username ≥ 4 chars, email regex,
  password ≥ 8 chars, password === confirm.
- **API:** `POST /auth/register/` (maps `confirmPassword → confirm_password`)
  only if validation passes. Success → toast → `navigate("/login")` after 2 s.

### 5.4 DashboardPage (`pages/dashboard/Dashboard.jsx`)
- **Route:** `/dashboard` (student).
- **State:** `savedPaths`, `stats{pathsExplored,decisionsMade,badgesEarned,
  level}`, `loading`, `toast`.
- **API (on mount, `Promise.all`):** `GET /simulator/saved-paths/`,
  `GET /gamification/progress/`. **On delete:** `DELETE
  /simulator/delete-path/{id}/` (after `window.confirm`).
- **Features:** time-based greeting + Dicebear avatar; 4 stat cards; a
  **client-side** level-progress bar
  `min((pathsExplored*10 + decisionsMade*5) % 100, 100)`; quick-action
  shortcuts; saved-paths grid (cards open `/simulator?pathId=<id>`; delete uses
  `stopPropagation`). Empty-state CTA when no paths.

### 5.5 ProfilePage (`pages/dashboard/Profile.jsx`)
- **Route:** `/profile` (student).
- **State:** `profile`, `loading`, `saving`, `editing`, `formData` (all profile
  fields incl. `skills_with_levels` map and joined `skills` string),
  `skillRows` (`[{name,level}]`), `toast`, `uploadingResume`.
- **API:**
  - `GET /profile/` on mount; a `404` flips to *create* mode (`editing=true`).
  - `POST /profile/upload-resume/` on resume file select (multipart, field
    `resume`).
  - `PUT /profile/` (update) or `POST /profile/` (create) on submit; then
    re-fetch.
- **Skill model conversion:** `skillMapToRows()` ↔ `rowsToSkillMap()` keep the
  `{skill: level}` map and the comma-joined `skills` text in sync.
- **Resume flow:** rejects files > 2 MB; reads `res.data.data`; applies
  `profile_patch` (education, years, current job, first desired-field
  suggestion) and **merges** extracted `skills_with_levels` into existing skill
  rows (extracted skills override). Resets the file input afterwards.
- Option lists: `PAKISTAN_CAREER_FIELDS`, `PAKISTAN_CITIES`,
  `PKR_SALARY_RANGES`, `EDUCATION_LEVELS`. View mode shows avatar, quick
  actions, career info grid and skills chips.

### 5.6 SimulatorPage (`pages/dashboard/Simulator.jsx`) — core module
- **Route:** `/simulator` (optionally `?pathId=<id>`), student.
- **Key state:** `careerPath` (tree `{rootNode,...}`), `savedPaths`,
  `savedPathsLoading`, `loading`, `selectedNode`, `userProfile`, `activePathId`,
  `showForkModal`, `showSaveModal`, `toast`, `pathName`, `decisionsCount`,
  `hoverNode{x,y,data}`, `exporting`, `expandedIds` (a `Set` of node ids whose
  children are visible — empty ⇒ only root shown).
- **Refs:** `svgRef`, `containerRef`, `treeWrapperRef`, `zoomBehaviorRef`,
  `renderTreeRef`, `lastTransformRef` (preserves zoom/pan), `preserveViewRef`.
- **API:**
  - `GET /profile/` on mount (for skill-gap comparison).
  - `GET /simulator/saved-paths/` on mount.
  - `GET /simulator/path/{id}/` on mount if `?pathId` present, or "Open" on a
    saved path. Parses `tree_data` (JSON string).
  - `POST /simulator/generate/` on Generate/Regenerate.
  - `POST /simulator/save-path/` with `{pathName, treeData, decisionsCount}`.
  - `DELETE /simulator/delete-path/{id}/` on delete.
- **Tree preprocessing:** `sanitizeTreeTitles` (dedupe repeated words),
  `pruneTreeToMaxDepth` (`MAX_TREE_DEPTH = 5` ⇒ 6 visible levels — **must match
  backend** `gemini_service.py`), `buildVisibleTree` (collapse-aware copy
  tagging `_hasChildren`, `_expanded`, `_hiddenChildCount`).
- **Skill-gap analysis:** `computeSkillGap(userSkillsWithLevels,
  requiredSkills)` using `LEVEL_RANK {basic:1, intermediate:2, expert:3}`;
  per-skill status `missing` / `upgrade` / `met` / `exceeds`.
  `summarizeSkillGap` rolls up `{total, ready, missing, upgrade, pct}`. Shown in
  the node-detail modal as colour-coded chips + a readiness bar. If
  `userProfile` is null, prompts the user to complete their profile.
- **D3 rendering (`renderTree`)**: `d3.hierarchy` of the visible tree,
  `d3.tree().nodeSize([220,165])`, `d3.linkVertical` links. Node colour:
  **amber** = collapsed (has hidden children), **green** = true leaf,
  depth-graded indigo/violet = expanded. Shows a `+N`/`−` expand badge, a
  separate `i` info button (own click target with `stopPropagation`), 2-line
  wrapped label, and a green PKR salary pill (`/1000 → k/mo`). Re-renders on
  `[careerPath, expandedIds]` and on window resize.
- **Zoom/pan:** `d3.zoom()` with `scaleExtent([0.2, 5])`, double-click zoom
  disabled. Computes `initialTransform` (readable first levels) and
  `fullTransform` (fit whole tree). `preserveViewRef`/`lastTransformRef` keep
  the viewport stable across expand/collapse; a brand-new path resets the view.
  Controls: `zoomBy(±0.3)`, `resetView()`, `fitAllNodes()`.
- **Interaction:** clicking a branch toggles its id in `expandedIds` (no API
  call — the whole tree is generated once); clicking a leaf or the `i` button
  opens the read-only **Node Details modal** (with skill-gap + Expand/Collapse).
- **PDF export (`handleExportPDF`):** `html2canvas(treeWrapperRef,{scale:2})` →
  PNG → `jsPDF("landscape","pt","a4")` with title + generated date + decisions
  line; saved as `career-path-<rootTitle>-<timestamp>.pdf`.

### 5.7 AchievementsPage (`pages/dashboard/Achievements.jsx`)
- **Route:** `/achievements` (student).
- **State:** `badges`, `progress`, `filter` (`all|earned|locked`), `loading`.
- **API (on mount):** `GET /gamification/badges/`, `GET
  /gamification/progress/`.
- **Features:** completion bar `round(earnedCount/badges.length*100)`; 4 stat
  cards; filter buttons with counts; badge grid (earned → emoji icon, locked →
  `Lock` icon + `requirements` text); two empty-state variants.

### 5.8 AdminLogin (`pages/admin/AdminLogin.jsx`)
- **Route:** `/admin/login` (public admin entry, no Navbar/Footer).
- **State:** `form{username,password}`, `loading`, `toast`, `showPassword`.
- **API:** `POST /admin/login/`. On success clears student keys, sets
  `adminToken`/`adminUser`/`isAdmin`, navigates to `/admin/dashboard`.

### 5.9 AdminDashboard (`pages/admin/AdminDashboard.jsx`)
- **Route:** `/admin/dashboard` (admin).
- **State:** `stats`, `loading`. **API:** `GET /admin/stats/` on mount; HTTP
  `403` → remove `isAdmin` and go to `/admin/login`.
- **Features:** exported shared `AdminNav` bar (Dashboard/Students/Badges links
  with active-link highlight, admin name, logout); welcome banner; 4 stat cards
  (`totalUsers`, `totalPaths`, `totalBadges`, `activeUsers`); quick actions;
  "Recently Joined Students" list (`recentUsers[]`).
- `AdminNav` is an **exported named component** reused by AdminUsers and
  AdminBadges.

### 5.10 AdminUsers (`pages/admin/AdminUsers.jsx`)
- **Route:** `/admin/users` (admin).
- **State:** `users`, `query`, `loading`, `toast`.
- **API:** `GET /admin/users/` on mount; `DELETE /admin/users/{id}/` on Remove
  (after confirm). Client-side filter on username/email; optimistic list
  removal.

### 5.11 AdminBadges (`pages/admin/AdminBadges.jsx`)
- **Route:** `/admin/badges` (admin).
- **State:** `badges`, `loading`, `saving`, `toast`, `showModal`,
  `editingBadge`, `form` (default `EMPTY_FORM`).
- **API:** `GET /admin/badges/` on mount and after every save/delete;
  `POST /admin/badges/` (create); `PUT /admin/badges/{id}/` (update);
  `DELETE /admin/badges/{id}/` (after confirm).
- **Logic:** validates name + description; trims fields; coerces
  `points_required` to Number; auto-generates `requirements` text if blank;
  flattens object-shaped server errors into a readable string. `EMOJI_OPTIONS`
  picker and `CATEGORY_OPTIONS` dropdown.

---

## 6. Reusable Components (`src/components/`)

| Component | Purpose | Key props |
|-----------|---------|-----------|
| `Button` | App button with loading spinner | `variant` (primary/secondary/outlined/ghost/danger), `size`, `loading`, `disabled`, `fullWidth`, `onClick`, `type` |
| `Input` / `Textarea` | Labeled form controls with error/helper text | `label`, `name`, `value`, `onChange`, `error`, `helperText`, `icon`, `required` |
| `Dropdown` | Styled `<select>` with custom arrow | `label`, `options`, `value`, `onChange`, `error` |
| `Modal` | Centered overlay dialog, locks body scroll | `isOpen`, `onClose`, `title`, `size`, `footer` |
| `Toast` | Auto-dismissing top-right notification | `message`, `type`, `duration` (4000 ms), `onClose` |
| `Loading` / `Skeleton` | Spinner / skeleton placeholders | `message` |
| `Alert` | Inline dismissible alert | `type`, `title`, `message`, `onClose` |
| `Badge` | Small status pill | `variant`, `size` |
| `Card` / `StatsCard` / `FeatureCard` | Card container + presets | `icon`, `value`, `label`, `title`, `description` |
| `Divider` | Horizontal rule with optional label | `label` |
| `ProgressBar` | Gradient progress bar | `value`, `max`, `label`, `showPercentage` |
| `layout/Navbar` | Public/student top nav (hidden on admin) | `isAuthenticated`, `username`, `onLogout` |
| `layout/Footer` | Site footer (brand, links, contact) | none |

> Note: several components (`Alert`, `Badge`, `Card`, `Divider`,
> `ProgressBar`) are part of the library but the analyzed pages currently use
> inline markup instead of importing them.

---

## 7. Branding / Logo

The brand logo is `frontend/public/Logo.png` and is referenced as `/Logo.png`.
It replaces the previous text-based "CareerPath / AI Simulator" lockup in:
**Navbar**, **Footer**, **Login**, **Register**, **AdminLogin**, and the shared
**AdminNav** (in `AdminDashboard.jsx`). Each usage is an `<img src="/Logo.png">`
with a height class and `w-auto` so the aspect ratio is preserved.

---

## 8. Cross-Cutting Notes (for the report)

- **Skill model:** profiles store skills two ways — a comma-joined `skills`
  string *and* a `skills_with_levels` map (`{skill: basic|intermediate|expert}`).
  Only the map feeds the Simulator's gap analysis.
- **`MAX_TREE_DEPTH = 5`** in `Simulator.jsx` is intentionally synced with the
  backend; legacy/deeper saved trees are pruned on load.
- **The full career tree is generated in one backend call** — expand/collapse
  is purely a client-side visibility toggle, so it is instant and offline-safe.
- **Environment:** set `VITE_API_BASE_URL` (see `frontend/.env.example`) to
  point the frontend at a non-default backend.
