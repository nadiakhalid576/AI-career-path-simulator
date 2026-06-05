# api/gemini_service.py
"""
LLM service for generating career paths.

Two providers wired up with automatic failover:
  1. Google Gemini  (primary)
  2. xAI Grok       (fallback, OpenAI-compatible REST API)

If both providers are unavailable (quota, network, missing key) the service
falls back to deterministic, field-aware mock data so the app stays usable.
"""
import logging
import os
import json
import time
from uuid import uuid4

import httpx
import google.genai as genai_client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ─── Per-provider circuit breakers ──────────────────────────────────────────
# When a provider call fails with 429 / quota / network timeout, we mark that
# provider as "blocked" for `_PROVIDER_COOLDOWN_SECONDS`. All subsequent calls
# in that window short-circuit straight to the next provider (or to mock if
# both are blocked). Without this, a single tree generation can fire 30+
# failing calls and stall for minutes.
_PROVIDER_COOLDOWN_SECONDS = 60
# A "permanent" error (bad key, 403 no-credits, license missing) won't fix
# itself within a request, so block that provider for the rest of the
# process lifetime instead of retrying it 100+ times per tree generation.
_PROVIDER_PERMANENT_COOLDOWN_SECONDS = 24 * 3600
_provider_blocked_until = {"gemini": 0.0, "grok": 0.0}
# Remember which providers we've already logged a permanent failure for,
# so we emit exactly ONE concise warning instead of a traceback per call.
_provider_perm_logged = set()


def _is_provider_blocked(provider):
    return time.time() < _provider_blocked_until.get(provider, 0.0)


def _block_provider(provider, reason, *, permanent=False):
    cooldown = (
        _PROVIDER_PERMANENT_COOLDOWN_SECONDS
        if permanent
        else _PROVIDER_COOLDOWN_SECONDS
    )
    _provider_blocked_until[provider] = time.time() + cooldown
    if permanent:
        if provider not in _provider_perm_logged:
            _provider_perm_logged.add(provider)
            logger.warning(
                "%s disabled for this session — %s. Falling back to the "
                "next provider / mock data.",
                provider,
                reason,
            )
    else:
        logger.warning(
            "%s temporarily unavailable (%ss cooldown): %s",
            provider,
            _PROVIDER_COOLDOWN_SECONDS,
            reason,
        )


# Backwards-compatible aliases (kept so any external code that imported
# the old names still works).
def _is_quota_blocked():
    return _is_provider_blocked("gemini")


def _block_quota_temporarily(reason):
    _block_provider("gemini", reason)


def _is_quota_or_network_error(exc):
    """Transient — worth retrying after a short cooldown."""
    text = str(exc).lower()
    return (
        "429" in text
        or "resource_exhausted" in text
        or "quota" in text
        or "rate limit" in text
        or "timeout" in text
        or "deadline_exceeded" in text
        or "504" in text
        or "503" in text
        or "502" in text
        or "winerror 10060" in text
        or ("connection" in text and "fail" in text)
    )


def _is_permanent_provider_error(exc):
    """Permanent for this session — bad key, no credits, no permission.
    Re-trying every call is pointless and floods the log."""
    text = str(exc).lower()
    return (
        "401" in text
        or "403" in text
        or "permission" in text
        or "unauthorized" in text
        or "no credits" in text
        or "any credits" in text
        or "license" in text
        or "api key not valid" in text
        or "api_key_invalid" in text
        or "invalid api key" in text
        or "is not configured" in text
    )

# ─── Gemini ────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
_gemini_client = None

# ─── Grok (xAI) — OpenAI-compatible REST API ───────────────────────────────
# Get a key from https://console.x.ai/. Both env names accepted for convenience.
GROK_API_KEY = os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY", "")
GROK_MODEL = os.getenv("GROK_MODEL", "grok-4-fast")
GROK_BASE_URL = os.getenv("GROK_BASE_URL", "https://api.x.ai/v1")


def configure_gemini():
    global _gemini_client
    if GEMINI_API_KEY and _gemini_client is None:
        # Timeout is in milliseconds for the genai SDK's HttpOptions.
        try:
            from google.genai import types as genai_types  # noqa: WPS433
            http_opts = genai_types.HttpOptions(
                timeout=int(GEMINI_HTTP_TIMEOUT * 1000),
            )
            _gemini_client = genai_client.Client(
                api_key=GEMINI_API_KEY,
                http_options=http_opts,
            )
        except Exception:
            # Fall back to default client if the SDK version doesn't accept
            # http_options the same way — better to work without timeout
            # than to crash on import.
            _gemini_client = genai_client.Client(api_key=GEMINI_API_KEY)
    return _gemini_client is not None


def _get_client():
    configure_gemini()
    return _gemini_client


def _call_gemini(prompt):
    """Send a single prompt to Gemini and return the raw text response.

    Raises on any error — caller should classify with `_is_quota_or_network_error`."""
    client = _get_client()
    response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
    text = (response.text or "").strip()
    if not text:
        raise ValueError("Gemini returned an empty response")
    return text


def _call_grok(prompt):
    """Send a single prompt to xAI Grok and return the assistant's content.

    Uses Grok's OpenAI-compatible Chat Completions endpoint. Raises on any
    error — caller should classify with `_is_quota_or_network_error`."""
    if not GROK_API_KEY:
        raise RuntimeError("GROK_API_KEY / XAI_API_KEY is not configured")

    url = f"{GROK_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROK_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROK_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert Pakistani career counsellor. "
                    "Always respond with VALID JSON only — no markdown fences, "
                    "no commentary, no preamble."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }
    resp = httpx.post(
        url,
        headers=headers,
        json=payload,
        timeout=GEMINI_HTTP_TIMEOUT,  # reuse the same timeout knob
    )
    if resp.status_code >= 400:
        raise RuntimeError(
            f"Grok HTTP {resp.status_code}: {resp.text[:300]}"
        )
    data = resp.json()
    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as e:
        raise ValueError(f"Unexpected Grok response shape: {e}") from e
    text = (text or "").strip()
    if not text:
        raise ValueError("Grok returned an empty response")
    return text


def _handle_provider_failure(provider, exc):
    """Classify a provider error and engage the right circuit breaker WITHOUT
    flooding the log: permanent errors → one concise warning + long block;
    transient → short cooldown; anything truly unexpected → single warning."""
    short = f"{exc!s}"[:160]
    if _is_permanent_provider_error(exc):
        _block_provider(provider, short, permanent=True)
    elif _is_quota_or_network_error(exc):
        _block_provider(provider, short)
    else:
        # Unexpected — log once at warning level (no stack-trace spam).
        logger.warning("%s call failed (unexpected): %s", provider, short)
        _block_provider(provider, short)


def _call_llm(prompt):
    """Try providers in order (Gemini → Grok). Return the raw text response,
    or `None` if every provider is unavailable (caller should use mock).

    Each provider has its own circuit breaker so a single failing call blocks
    that provider for the rest of the request (or the session, if the error
    is permanent like a 403 / no-credits) and we jump straight to the next
    provider or to the deterministic mock — no retry storms, no log spam."""
    # ── Provider 1: Gemini ────────────────────────────────────────────────
    if GEMINI_API_KEY and configure_gemini() and not _is_provider_blocked("gemini"):
        try:
            return _call_gemini(prompt)
        except Exception as exc:  # noqa: BLE001
            _handle_provider_failure("gemini", exc)

    # ── Provider 2: Grok (xAI) ────────────────────────────────────────────
    if GROK_API_KEY and not _is_provider_blocked("grok"):
        try:
            text = _call_grok(prompt)
            logger.info("Grok served the request (Gemini unavailable)")
            return text
        except Exception as exc:  # noqa: BLE001
            _handle_provider_failure("grok", exc)

    return None


# ============================================================
# PAKISTAN CAREER CONTEXT — injected into every prompt
# ============================================================
PAKISTAN_CONTEXT = """
IMPORTANT CONTEXT — This career guidance is specifically for the Pakistan job market.
Use the following Pakistan-specific guidelines throughout ALL your responses:

SALARY RANGES (monthly in PKR — Pakistani Rupees):
  Entry level    : 30,000 – 80,000 PKR/month
  Mid level      : 80,000 – 200,000 PKR/month
  Senior level   : 200,000 – 500,000 PKR/month
  Expert/Senior+ : 500,000 – 1,500,000+ PKR/month
  Freelancing    : highly variable; multiply 2–5x local rates
  Always return salary as a PKR monthly figure (integer).

MAJOR CAREER FIELDS AVAILABLE IN PAKISTAN:
  1. Technology & IT          — Software Engineering, AI/ML, Cybersecurity, Data Science, DevOps, Web/Mobile Dev
  2. Medicine & Healthcare    — MBBS, BDS, PMDC-registered specializations, Nursing, Pharmacy, Physiotherapy
  3. Engineering              — Civil, Electrical, Mechanical, Chemical, Petroleum, Environmental, Structural
  4. Business & Commerce      — MBA, CA (ICAP), ACCA, CPA, Finance, Accounting, Supply Chain, Marketing
  5. Law & Legal              — LLB, LLM, Barrister (UK), Corporate Law, Litigation, Judge track (PCS)
  6. Education & Teaching     — School Teacher, University Lecturer, Academic Research, TEVTA Instructor
  7. Government & Civil Services — CSS (Central Superior Services), PCS (Provincial), PMS, Police, Military
  8. Banking & Finance        — Commercial Banking, Islamic Banking, Investment Banking, Microfinance, SBP
  9. Media & Journalism       — Print, Digital, TV/Radio Broadcasting, Photojournalism, PR, Social Media
  10. Arts, Design & Creative — Graphic Design, UX/UI, Architecture, Interior Design, Fashion, Fine Arts
  11. Agriculture             — Crop Sciences, Livestock, Agri-Business, Food Technology, Horticulture
  12. Sciences & Research     — Pure Sciences (Physics, Chemistry, Biology), Biotechnology, Environmental Science
  13. Social Sciences         — Psychology, Sociology, Social Work, Development Sector / NGOs, HR
  14. Military & Defense      — Pak Army / Navy / PAF officer tracks, Defense Research
  15. Real Estate             — Property Development, Construction Management, Real Estate Investment
  16. Hospitality & Tourism   — Hotel Management, Travel & Tourism, Culinary Arts

JOB MARKET CONTEXT (Pakistan):
  - Karachi: financial hub, IT sector, media, fashion
  - Lahore: IT, manufacturing, education, arts
  - Islamabad/Rawalpindi: government, foreign missions, IT, NGOs
  - Peshawar: government, education, healthcare
  - Quetta: government, mining, healthcare
  - Remote/Freelancing: Upwork/Fiverr widely used for tech, design, writing
  - Government jobs are highly sought (stability, pension)
  - HEC-recognized degrees required for most formal positions
  - PMDC, PEC, PCATP, ICAP, ICMAP are key regulatory bodies per field
"""

# ============================================================
# CAREER FIELD TAXONOMY — for mock/fallback data
# ============================================================
PAKISTAN_CAREER_TAXONOMY = {
    "Technology & IT": {
        "tracks": [
            "Software Engineer",
            "AI/ML Engineer",
            "Cybersecurity Analyst",
            "Data Scientist",
            "DevOps Engineer",
            "Mobile Developer",
        ],
        "entry_salary": 60000,
        "growth_multiplier": 1.3,
    },
    "Medicine & Healthcare": {
        "tracks": [
            "House Officer (MBBS)",
            "Medical Officer",
            "Medical Specialist",
            "Surgeon",
            "Dentist",
            "Pharmacist",
        ],
        "entry_salary": 80000,
        "growth_multiplier": 1.25,
    },
    "Engineering": {
        "tracks": [
            "Junior Engineer",
            "Site Engineer",
            "Project Engineer",
            "Senior Engineer",
            "Principal Engineer",
        ],
        "entry_salary": 55000,
        "growth_multiplier": 1.2,
    },
    "Business & Commerce": {
        "tracks": [
            "Accounts Officer",
            "Finance Analyst",
            "CA Trainee",
            "Manager Finance",
            "CFO",
        ],
        "entry_salary": 50000,
        "growth_multiplier": 1.25,
    },
    "Law & Legal": {
        "tracks": [
            "Junior Advocate",
            "Senior Advocate",
            "Corporate Counsel",
            "Partner (Law Firm)",
            "Additional Judge",
        ],
        "entry_salary": 40000,
        "growth_multiplier": 1.2,
    },
    "Education & Teaching": {
        "tracks": [
            "School Teacher",
            "Senior Teacher",
            "Head of Department",
            "Vice Principal",
            "Principal / Lecturer",
        ],
        "entry_salary": 35000,
        "growth_multiplier": 1.15,
    },
    "Government & Civil Services": {
        "tracks": [
            "Assistant Commissioner",
            "Deputy Commissioner",
            "Additional Commissioner",
            "Commissioner",
            "Secretary",
        ],
        "entry_salary": 60000,
        "growth_multiplier": 1.18,
    },
    "Banking & Finance": {
        "tracks": [
            "Junior Officer",
            "Branch Manager Trainee",
            "Relationship Manager",
            "Senior Manager",
            "VP/SVP",
        ],
        "entry_salary": 55000,
        "growth_multiplier": 1.22,
    },
    "Media & Journalism": {
        "tracks": [
            "Reporter/Correspondent",
            "Senior Reporter",
            "Sub-Editor",
            "Editor",
            "News Director",
        ],
        "entry_salary": 35000,
        "growth_multiplier": 1.15,
    },
    "Arts, Design & Creative": {
        "tracks": [
            "Junior Designer",
            "Graphic Designer",
            "Senior Designer",
            "Art Director",
            "Creative Director",
        ],
        "entry_salary": 40000,
        "growth_multiplier": 1.2,
    },
    "Agriculture": {
        "tracks": [
            "Agricultural Officer",
            "Field Supervisor",
            "Farm Manager",
            "Agri Consultant",
            "Agri Business Director",
        ],
        "entry_salary": 40000,
        "growth_multiplier": 1.15,
    },
    "Sciences & Research": {
        "tracks": [
            "Research Assistant",
            "Research Officer",
            "Senior Research Officer",
            "Principal Scientist",
            "Director Research",
        ],
        "entry_salary": 45000,
        "growth_multiplier": 1.2,
    },
    "Social Sciences": {
        "tracks": [
            "Program Officer (NGO)",
            "M&E Officer",
            "Project Coordinator",
            "Program Manager",
            "Country Director",
        ],
        "entry_salary": 45000,
        "growth_multiplier": 1.18,
    },
    "Military & Defense": {
        "tracks": [
            "Cadet Officer",
            "Captain",
            "Major",
            "Lieutenant Colonel",
            "Colonel / Brigadier",
        ],
        "entry_salary": 70000,
        "growth_multiplier": 1.18,
    },
    "Real Estate": {
        "tracks": [
            "Property Consultant",
            "Senior Sales Executive",
            "Branch Manager",
            "Regional Manager",
            "Director Real Estate",
        ],
        "entry_salary": 45000,
        "growth_multiplier": 1.25,
    },
    "Hospitality & Tourism": {
        "tracks": [
            "Front Desk Associate",
            "Guest Relations Officer",
            "F&B Supervisor",
            "Hotel Operations Manager",
            "General Manager (Hotel)",
        ],
        "entry_salary": 40000,
        "growth_multiplier": 1.2,
    },
}


def _normalize_field_key(value):
    """Loose normaliser so 'technology & it' / 'Technology and IT' / 'Tech & IT'
    all resolve to the canonical taxonomy key."""
    if not value:
        return ""
    return (
        str(value)
        .strip()
        .lower()
        .replace("&", "and")
        .replace("/", " ")
        .replace("-", " ")
    )


def _resolve_taxonomy(desired_field):
    """Case/punctuation-insensitive taxonomy lookup. Returns (canonical_key, taxonomy)."""
    if not desired_field:
        return None, None
    target = _normalize_field_key(desired_field)
    for key, value in PAKISTAN_CAREER_TAXONOMY.items():
        if _normalize_field_key(key) == target:
            return key, value
    # Soft-match: contains check both directions
    for key, value in PAKISTAN_CAREER_TAXONOMY.items():
        norm_key = _normalize_field_key(key)
        if target in norm_key or norm_key in target:
            return key, value
    return None, None


def _new_node_id(prefix="node"):
    return f"{prefix}_{uuid4().hex[:10]}"


# Model is configurable via the GEMINI_MODEL env var so the operator can
# swap to `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-1.5-flash`, etc.
# without code changes. Default is `gemini-2.5-flash` because as of 2026
# `gemini-2.0-flash` is no longer offered on the free tier for newly created
# API keys (you will see "limit: 0" in 429 errors).
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# HTTP timeout (seconds) for individual Gemini calls. Without this the SDK
# waits ~30s per call and retries multiple times — a single failing tree
# generation can stall the request for several minutes.
GEMINI_HTTP_TIMEOUT = float(os.getenv("GEMINI_HTTP_TIMEOUT", "10"))

# Hard cap on tree depth. Root is level 0, so MAX_TREE_DEPTH = 5 means
# the tree shows 6 levels total (0, 1, 2, 3, 4, 5). Frontend matches this
# constant when blocking fork-selection past the leaf level.
MAX_TREE_DEPTH = 5

# Exactly how many top-level branches hang directly off the root node.
TOP_BRANCH_COUNT = 4


def _clean_json_text(raw_text):
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _parse_json_response(raw_text, fallback):
    try:
        return json.loads(_clean_json_text(raw_text))
    except Exception:
        return fallback


def _coerce_int(value, default_value=0):
    try:
        return int(value)
    except Exception:
        return default_value


def _clean_job_title(title, fallback_title="Career Step"):
    raw = str(title or fallback_title).strip()
    if not raw:
        raw = fallback_title

    normalized = " ".join(raw.split())
    parts = normalized.split(" ")
    cleaned_parts = []
    for part in parts:
        if cleaned_parts and cleaned_parts[-1].lower() == part.lower():
            continue
        cleaned_parts.append(part)

    cleaned = " ".join(cleaned_parts).strip(" -_/,")
    return cleaned or fallback_title


def _normalize_node(node, profile_data, level_index=0):
    job_title = _clean_job_title(
        (
            node.get("jobTitle")
            or node.get("title")
            or profile_data.get("current_job")
            or "Career Step"
        )
    )
    desired_field = profile_data.get("desired_field") or "General"
    salary = _coerce_int(node.get("salary"), 0)

    # requiredSkills can be list of dicts [{name, level}] OR list of strings — normalise to dicts
    raw_skills = node.get("requiredSkills") or []
    required_skills = []
    for s in raw_skills:
        if isinstance(s, dict):
            required_skills.append(
                {"name": s.get("name", str(s)), "level": s.get("level", "intermediate")}
            )
        else:
            required_skills.append({"name": str(s), "level": "intermediate"})

    return {
        "id": node.get("id") or _new_node_id(),
        "jobTitle": job_title,
        "salary": salary,
        "timeline": node.get("timeline") or f"Level {level_index}",
        "description": node.get("description")
        or node.get("rationale")
        or f"Recommended step toward {desired_field} in Pakistan",
        "careerField": node.get("careerField") or desired_field,
        "requiredSkills": required_skills,
        "matchScore": _coerce_int(node.get("matchScore"), 0),
        "confidenceScore": _coerce_int(
            node.get("confidenceScore"), node.get("matchScore", 0)
        ),
        "skillGapCount": _coerce_int(node.get("skillGapCount"), 0),
        "sector": node.get("sector") or "Private",
        "growthPotential": node.get("growthPotential") or "Medium",
        "levelIndex": level_index,
        "children": node.get("children") or [],
    }


def _format_skills_for_prompt(profile_data):
    skills_with_levels = profile_data.get("skills_with_levels") or {}
    if isinstance(skills_with_levels, dict) and skills_with_levels:
        return ", ".join(
            f"{name} ({level})" for name, level in skills_with_levels.items()
        )
    raw = profile_data.get("skills")
    if raw:
        return raw
    return "Not specified"


def _build_top_branch_prompt(profile_data, min_branches):
    skills_info = _format_skills_for_prompt(profile_data)
    desired_field = profile_data.get("desired_field") or "Not specified"
    return f"""
{PAKISTAN_CONTEXT}

You are an expert Pakistani career counsellor with deep knowledge of the Pakistani job market.

USER PROFILE:
- Name: {profile_data.get('full_name', 'User')}
- Current role: {profile_data.get('current_job', 'Fresh Graduate / Student')}
- Education: {profile_data.get('education_level', 'Not specified')}
- Years of experience: {profile_data.get('years_experience', 0)}
- Desired career field: {desired_field}
- Salary expectation (PKR/month): {profile_data.get('salary_expectation') or profile_data.get('salary_range') or 'Not specified'}
- Current skills (with proficiency): {skills_info}
- Location: {profile_data.get('location', 'Pakistan')}

CRITICAL RULES:
1. EVERY branch MUST be inside the user's desired career field: "{desired_field}". Do NOT default to Software Engineering / Technology unless that is the desired field.
2. Tailor each branch around the user's actual skills listed above. Reference relevant skills directly in `requiredSkills`.
3. If desired field is Medicine, every branch must be a medical career (doctor, surgeon, specialist, hospital admin, public health, medical research, telemedicine, etc.) — NEVER "Software Engineer".
4. If desired field is Law, every branch must be a legal career (advocate, corporate counsel, judge, legal researcher, etc.).
5. If desired field is Engineering, branches must reflect THAT engineering discipline (civil/mechanical/electrical/etc.) inferred from the user's skills.
6. Same rule applies for every other field — branches must stay inside the chosen field.

TASK:
Generate EXACTLY {min_branches} realistic career path branches for this user in the Pakistani job market for the field "{desired_field}".
Each branch must be a DISTINCT direction (not just seniority levels of the same role).
Cover diverse strategic paths INSIDE the field: e.g., government sector vs private sector, specialization vs leadership, entrepreneurship/clinic/practice, freelancing/consulting, academia/teaching, abroad/remote.
ALL salaries must be in PKR (Pakistani Rupees) monthly.
requiredSkills must list the SPECIFIC skills needed for that exact role; reuse the user's skills where applicable.
skillGapCount = number of required skills the user currently does NOT have.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "branches": [
    {{
      "jobTitle": "Senior Software Engineer",
      "salary": 150000,
      "timeline": "In 2 years",
      "description": "Lead development teams at a Pakistani IT company or multinational, working on enterprise software solutions.",
      "careerField": "Technology & IT",
      "requiredSkills": [
        {{"name": "React.js", "level": "expert"}},
        {{"name": "Node.js", "level": "intermediate"}},
        {{"name": "System Design", "level": "intermediate"}},
        {{"name": "Team Leadership", "level": "basic"}}
      ],
      "matchScore": 82,
      "confidenceScore": 78,
      "skillGapCount": 2,
      "sector": "Private",
      "growthPotential": "High"
    }}
  ]
}}
"""


def _build_children_prompt(parent_node, profile_data, target_level):
    skills_info = _format_skills_for_prompt(profile_data)
    parent_field = parent_node.get("careerField") or profile_data.get(
        "desired_field", "General"
    )
    return f"""
{PAKISTAN_CONTEXT}

You are an expert Pakistani career counsellor expanding a career tree.

USER PROFILE:
- Education: {profile_data.get('education_level', 'Not specified')}
- Experience: {profile_data.get('years_experience', 0)} years
- Desired field: {profile_data.get('desired_field', 'Not specified')}
- Salary expectation (PKR/month): {profile_data.get('salary_expectation') or profile_data.get('salary_range') or 'Not specified'}
- Current skills (with proficiency): {skills_info}

PARENT CAREER NODE (current position to grow from):
- Job title: {parent_node.get('jobTitle', 'Unknown')}
- Current salary: {parent_node.get('salary', 0)} PKR/month
- Timeline: {parent_node.get('timeline', 'Current')}
- Field: {parent_field}
- Description: {parent_node.get('description', '')}

CRITICAL RULES:
1. The 2 child nodes MUST stay inside the field "{parent_field}". Do NOT pivot to Software Engineering / Technology unless the parent is already in that field.
2. Each child must be a logical next step from the parent role IN THE SAME FIELD.
3. requiredSkills must reflect skills that matter for that role in Pakistan, leveraging the user's existing skills where possible.

TASK:
Generate exactly 2 realistic next-step career nodes for Level {target_level} in the Pakistani job market within the "{parent_field}" field.
The 2 options should represent DIFFERENT strategic directions (e.g., specialization vs leadership, private vs government, local vs abroad/remote, in-house vs entrepreneurship/private practice).
ALL salaries must be PKR monthly. Salary should logically increase from parent.
requiredSkills must be specific to that exact role in Pakistan.
Do NOT repeat seniority words in job titles. Bad examples: "Senior Senior Engineer", "Lead Lead Developer".
If the parent role already includes words like Senior, Lead, Principal, Manager, Director, then advance to a different title instead of repeating the same modifier.

Return ONLY valid JSON:
{{
  "children": [
    {{
      "jobTitle": "Tech Lead",
      "salary": 220000,
      "timeline": "In {target_level} years",
      "description": "Lead a development team of 5-8 engineers at a mid-size Pakistani IT company, responsible for architecture decisions and code quality.",
      "careerField": "{parent_node.get('careerField', 'General')}",
      "requiredSkills": [
        {{"name": "Team Leadership", "level": "intermediate"}},
        {{"name": "Software Architecture", "level": "intermediate"}},
        {{"name": "Agile/Scrum", "level": "expert"}},
        {{"name": "Code Review", "level": "expert"}}
      ],
      "matchScore": 85,
      "confidenceScore": 80,
      "skillGapCount": 1,
      "sector": "Private",
      "growthPotential": "High"
    }}
  ]
}}
"""


def _user_skill_subset(profile_data, max_count=3):
    """Pick a few of the user's actual skills (with levels) to surface in mock data."""
    skills_with_levels = profile_data.get("skills_with_levels") or {}
    if isinstance(skills_with_levels, dict) and skills_with_levels:
        items = list(skills_with_levels.items())[:max_count]
        return [
            {"name": name, "level": (level or "intermediate")} for name, level in items
        ]
    raw = profile_data.get("skills") or ""
    if isinstance(raw, str) and raw.strip():
        names = [s.strip() for s in raw.split(",") if s.strip()][:max_count]
        return [{"name": n, "level": "intermediate"} for n in names]
    return []


def _mock_top_branches(profile_data, min_branches=TOP_BRANCH_COUNT):
    desired_field_input = profile_data.get("desired_field") or "Technology & IT"
    canonical_key, taxonomy = _resolve_taxonomy(desired_field_input)

    # If we still cannot resolve a field, build a field-named generic taxonomy
    # so the user does NOT silently get Technology & IT as a fallback.
    if taxonomy is None:
        canonical_key = desired_field_input
        taxonomy = {
            "tracks": [
                f"Junior {desired_field_input} Professional",
                f"{desired_field_input} Specialist",
                f"Senior {desired_field_input} Practitioner",
                f"{desired_field_input} Manager",
                f"Director of {desired_field_input}",
            ],
            "entry_salary": 50000,
            "growth_multiplier": 1.2,
        }

    desired_field = canonical_key or desired_field_input
    tracks = taxonomy["tracks"]
    entry_salary = taxonomy["entry_salary"]
    mult = taxonomy["growth_multiplier"]
    user_skills = _user_skill_subset(profile_data)

    templates = [
        ("Private Sector Track", "Private", "High"),
        ("Government / Public Sector Track", "Government", "Medium"),
        ("Freelancing / Remote Track", "Freelance", "High"),
        ("Management & Leadership Track", "Private", "High"),
        ("Academic / Research Track", "Academia", "Medium"),
        ("Entrepreneurship Track", "Self-employed", "Very High"),
    ]
    field_hints = _FIELD_SKILL_HINTS.get(canonical_key, [])
    results = []
    for idx in range(min(min_branches, len(templates))):
        track_label, sector, growth = templates[idx]
        salary_pkr = int(entry_salary * (mult**idx))

        # Build a per-track unique skill list:
        # 1) up to 2 of the user's real skills  → personalisation
        # 2) one rotating field hint            → field flavour, varies per branch
        # 3) the track's seed skills            → distinct between branches
        track_seeds = [
            {"name": name, "level": level}
            for name, level in _TRACK_SKILL_SEEDS.get(track_label, [])
        ]
        rotating_hint = (
            [{"name": field_hints[idx % len(field_hints)], "level": "intermediate"}]
            if field_hints
            else []
        )
        merged = []
        seen = set()
        for skill in (list(user_skills)[:2] + rotating_hint + track_seeds):
            key = (skill.get("name") or "").lower().strip()
            if not key or key in seen:
                continue
            seen.add(key)
            merged.append(skill)
            if len(merged) >= 4:
                break
        if not merged:
            merged = [
                {"name": "Domain Knowledge", "level": "intermediate"},
                {"name": "Communication Skills", "level": "intermediate"},
            ]

        results.append(
            {
                "jobTitle": f"{tracks[min(idx, len(tracks) - 1)]}",
                "salary": salary_pkr,
                "timeline": f"In {idx + 1} {'year' if idx == 0 else 'years'}",
                "description": (
                    f"{track_label} in {desired_field} — a practical progression "
                    f"in Pakistan's job market that builds on your existing background."
                ),
                "careerField": desired_field,
                "requiredSkills": merged,
                "matchScore": 70 + idx * 2,
                "confidenceScore": 65 + idx * 2,
                "skillGapCount": max(0, 2 - len(user_skills)),
                "sector": sector,
                "growthPotential": growth,
            }
        )
    while len(results) < min_branches:
        idx = len(results)
        results.append(
            {
                "jobTitle": f"{desired_field} Specialist",
                "salary": int(entry_salary * (mult**idx)),
                "timeline": f"In {idx + 1} years",
                "description": f"Specialization path in {desired_field}.",
                "careerField": desired_field,
                "requiredSkills": user_skills
                or [{"name": "Technical Expertise", "level": "expert"}],
                "matchScore": 72,
                "confidenceScore": 68,
                "skillGapCount": 1,
                "sector": "Private",
                "growthPotential": "Medium",
            }
        )
    return results


_FIELD_SKILL_HINTS = {
    "Medicine & Healthcare": ["Patient Care", "Clinical Diagnostics", "Medical Ethics"],
    "Engineering": ["Project Engineering", "AutoCAD", "Site Supervision"],
    "Law & Legal": ["Legal Drafting", "Case Research", "Negotiation"],
    "Education & Teaching": ["Curriculum Design", "Classroom Management", "Assessment Design"],
    "Government & Civil Services": ["Public Policy", "Administration", "Stakeholder Management"],
    "Banking & Finance": ["Credit Analysis", "Financial Modeling", "Regulatory Compliance"],
    "Business & Commerce": ["Financial Reporting", "Business Strategy", "Stakeholder Management"],
    "Media & Journalism": ["News Writing", "Editorial Judgement", "Source Development"],
    "Arts, Design & Creative": ["Visual Design", "Brand Storytelling", "Creative Direction"],
    "Agriculture": ["Crop Management", "Farm Operations", "Agribusiness Planning"],
    "Sciences & Research": ["Research Methodology", "Data Analysis", "Scientific Writing"],
    "Social Sciences": ["Program Design", "Monitoring & Evaluation", "Community Engagement"],
    "Military & Defense": ["Tactical Leadership", "Discipline & Drill", "Strategic Planning"],
    "Real Estate": ["Property Valuation", "Negotiation", "Client Acquisition"],
    "Hospitality & Tourism": ["Guest Experience", "Operations Management", "Service Standards"],
    "Technology & IT": ["System Design", "Code Review", "Cloud Fundamentals"],
}

# Per-track skill seeds — each top branch templated below gets a *different*
# set of base skills so two branches for the same user never look identical.
_TRACK_SKILL_SEEDS = {
    "Private Sector Track": [
        ("Performance Delivery", "intermediate"),
        ("Client Engagement", "intermediate"),
    ],
    "Government / Public Sector Track": [
        ("Public Sector Process", "intermediate"),
        ("Policy Implementation", "basic"),
    ],
    "Freelancing / Remote Track": [
        ("Self-Management", "expert"),
        ("Remote Collaboration", "intermediate"),
    ],
    "Management & Leadership Track": [
        ("People Management", "intermediate"),
        ("Strategic Planning", "intermediate"),
    ],
    "Academic / Research Track": [
        ("Research Methodology", "intermediate"),
        ("Scientific Writing", "intermediate"),
    ],
    "Entrepreneurship Track": [
        ("Business Development", "intermediate"),
        ("Financial Acumen", "basic"),
    ],
}


def _field_skill_hints(field, level="intermediate"):
    """Return field-specific skill suggestions instead of generic 'Administrative / Report Writing'."""
    if not field:
        return []
    canonical, _ = _resolve_taxonomy(field)
    hints = _FIELD_SKILL_HINTS.get(canonical or field, [])
    return [{"name": name, "level": level} for name in hints]


def _build_required_skills(profile_data, field, base_skills, variant_index=0):
    """Combine the user's real skills with field-specific defaults so two
    different users (or two different nodes) never end up with identical
    'Administrative Skills + Report Writing' chips.

    Priority order (first-come-first-included, max 4 chips):
      1. base_skills        — distinguish this branch from its siblings
      2. user_skills (2)    — personalisation
      3. field hints        — rotated by variant_index for sibling diversity
    """
    user_skills = _user_skill_subset(profile_data or {}, max_count=2)
    field_hints = _field_skill_hints(field)
    rotated_hints = (
        field_hints[variant_index % len(field_hints):]
        + field_hints[: variant_index % len(field_hints)]
        if field_hints
        else []
    )
    candidates = list(base_skills) + user_skills + rotated_hints
    seen = set()
    merged = []
    for skill in candidates:
        key = (skill.get("name") or "").lower().strip()
        if not key or key in seen:
            continue
        seen.add(key)
        merged.append(skill)
        if len(merged) >= 4:
            break
    return merged or base_skills


def _mock_children(parent_node, level_index, profile_data=None):
    base_salary = _coerce_int(parent_node.get("salary"), 60000)
    title = _clean_job_title(parent_node.get("jobTitle", "Career Step"))
    field = parent_node.get("careerField") or (profile_data or {}).get(
        "desired_field"
    ) or "General"
    promoted_title = title
    if not any(
        word in title.lower().split()
        for word in ["senior", "lead", "principal", "manager", "director"]
    ):
        promoted_title = f"Senior {title}"
    elif "senior" in title.lower().split():
        promoted_title = title.replace("Senior", "Lead", 1).replace("senior", "Lead", 1)
    elif "lead" in title.lower().split():
        promoted_title = title.replace("Lead", "Principal", 1).replace(
            "lead", "Principal", 1
        )
    elif "manager" in title.lower().split():
        promoted_title = title.replace("Manager", "Senior Manager", 1).replace(
            "manager", "Senior Manager", 1
        )
    elif "director" in title.lower().split():
        promoted_title = f"Regional {title}"

    leadership_skills = _build_required_skills(
        profile_data,
        field,
        [
            {"name": "People Management", "level": "intermediate"},
            {"name": "Strategic Planning", "level": "basic"},
        ],
        variant_index=level_index,
    )
    public_sector_skills = _build_required_skills(
        profile_data,
        field,
        [
            {"name": "Policy Implementation", "level": "intermediate"},
            {"name": "Public Sector Process", "level": "basic"},
        ],
        variant_index=level_index + 1,
    )

    return [
        {
            "jobTitle": _clean_job_title(promoted_title),
            "salary": int(base_salary * 1.25),
            "timeline": f"In {level_index} years",
            "description": (
                f"Senior-level role in {field} with deeper domain and "
                "strategic responsibilities in Pakistan."
            ),
            "careerField": field,
            "requiredSkills": leadership_skills,
            "matchScore": 80,
            "confidenceScore": 75,
            "skillGapCount": 1,
            "sector": parent_node.get("sector", "Private"),
            "growthPotential": "High",
        },
        {
            "jobTitle": _clean_job_title(f"{title} (Government / Institutional)"),
            "salary": int(base_salary * 1.15),
            "timeline": f"In {level_index + 1} years",
            "description": (
                f"Transition to government or public sector in {field} — "
                "stable, pensionable position with BPS grade."
            ),
            "careerField": field,
            "requiredSkills": public_sector_skills,
            "matchScore": 72,
            "confidenceScore": 70,
            "skillGapCount": 2,
            "sector": "Government",
            "growthPotential": "Medium",
        },
    ]


def _generate_top_branches(profile_data, min_branches=TOP_BRANCH_COUNT):
    prompt = _build_top_branch_prompt(profile_data, min_branches)
    raw = _call_llm(prompt)
    if not raw:
        logger.warning(
            "All LLM providers unavailable; using mock top branches for desired_field=%r",
            profile_data.get("desired_field"),
        )
        return _mock_top_branches(profile_data, min_branches)

    parsed = _parse_json_response(raw, {"branches": []})
    branches = parsed.get("branches") if isinstance(parsed, dict) else []
    if not isinstance(branches, list):
        branches = []
    if not branches:
        logger.warning(
            "LLM returned no branches for desired_field=%r; topping up from mock",
            profile_data.get("desired_field"),
        )
    if len(branches) < min_branches:
        branches.extend(
            _mock_top_branches(profile_data, min_branches - len(branches))
        )
    return branches[: max(min_branches, len(branches))]


def _generate_children(parent_node, profile_data, target_level):
    prompt = _build_children_prompt(parent_node, profile_data, target_level)
    raw = _call_llm(prompt)
    if not raw:
        return _mock_children(parent_node, target_level, profile_data)

    parsed = _parse_json_response(raw, {"children": []})
    children = parsed.get("children") if isinstance(parsed, dict) else []
    if not isinstance(children, list) or len(children) < 2:
        return _mock_children(parent_node, target_level, profile_data)
    return children[:2]


def _expand_branch_recursive(node, profile_data, max_level):
    current_level = _coerce_int(node.get("levelIndex"), 0)
    if current_level >= max_level:
        node["children"] = []
        return node

    child_level = current_level + 1
    generated_children = _generate_children(node, profile_data, child_level)
    normalized_children = []
    for child in generated_children:
        normalized = _normalize_node(child, profile_data, child_level)
        normalized_children.append(
            _expand_branch_recursive(normalized, profile_data, max_level)
        )

    node["children"] = normalized_children
    return node


def _build_root_title(profile_data):
    """Pick a root-node title that reflects BOTH the user's current role and
    their desired field, so the tree's top doesn't always read as the
    user's current job (which causes the 'always Software Developer' issue
    when current_job and desired_field disagree)."""
    current = (profile_data.get("current_job") or "").strip()
    desired = (profile_data.get("desired_field") or "").strip()

    if current and desired:
        # If the current role already aligns with the field, just keep it.
        if _normalize_field_key(desired) in _normalize_field_key(current) or (
            current.lower() in desired.lower()
        ):
            return current
        # Otherwise show the user that this tree is a transition path.
        return f"{current} → {desired}"
    if current:
        return current
    if desired:
        return f"Aspiring {desired} Professional"
    return "Current Role"


def generate_career_path(profile_data):
    """
    Generate staged career tree:
    1) top-level branches (>= 5)
    2) branch expansion with separate calls to depth 4
    """
    desired_field = profile_data.get("desired_field") or "General"
    user_skills = _user_skill_subset(profile_data, max_count=5)

    root_node = {
        "id": _new_node_id(),
        "jobTitle": _build_root_title(profile_data),
        "salary": 0,
        "timeline": "Current",
        "description": (
            f"Starting point for your journey into {desired_field} — "
            f"branches below are tailored to your skills and chosen field."
        ),
        "careerField": desired_field,
        "requiredSkills": user_skills,
        "matchScore": 100,
        "levelIndex": 0,
        "children": [],
    }

    top_branch_raw = _generate_top_branches(
        profile_data, min_branches=TOP_BRANCH_COUNT
    )
    top_branches = []
    for branch in top_branch_raw[:TOP_BRANCH_COUNT]:
        # Force every branch to inherit the desired_field so unrelated AI hallucinations
        # cannot drift the tree back to a generic "Technology & IT" path.
        if not branch.get("careerField"):
            branch["careerField"] = desired_field
        normalized = _normalize_node(branch, profile_data, level_index=1)
        top_branches.append(
            _expand_branch_recursive(normalized, profile_data, max_level=MAX_TREE_DEPTH)
        )

    root_node["children"] = top_branches
    return {
        "rootNode": root_node,
        "metadata": {
            "branchCount": len(top_branches),
            "generatedLevels": MAX_TREE_DEPTH,
            "maxDepth": MAX_TREE_DEPTH,
            "generationMode": "staged",
            "desiredField": desired_field,
        },
    }


def regenerate_subtree(profile_data, selected_node, max_level=MAX_TREE_DEPTH):
    """Regenerate only selected node descendants while preserving selected node identity."""
    selected_level = _coerce_int(selected_node.get("levelIndex"), 0)
    base_node = _normalize_node(selected_node, profile_data, level_index=selected_level)
    return _expand_branch_recursive(base_node, profile_data, max_level=max_level)


def replace_node_subtree(tree_data, node_id, new_subtree):
    """Replace subtree at node_id and return (updated_tree, changed)."""
    root = (tree_data or {}).get("rootNode")
    if not root:
        return tree_data, False

    def _replace(node):
        if node.get("id") == node_id:
            node.update(new_subtree)
            return True
        children = node.get("children") or []
        for child in children:
            if _replace(child):
                return True
        return False

    changed = _replace(root)
    return tree_data, changed


def generate_fork_options(node_data, profile_data):
    """
    Generate 3 distinct next-step career options for the given node.
    Falls through Gemini → Grok → mock fallback automatically.
    """
    skills_info = _format_skills_for_prompt(profile_data)
    node_field = node_data.get("careerField") or profile_data.get(
        "desired_field", "Unknown"
    )

    prompt = f"""
{PAKISTAN_CONTEXT}

A person is currently at this career position in Pakistan:
- Job Title: {node_data.get('jobTitle', 'Unknown')}
- Monthly Salary (PKR): {node_data.get('salary', 0)}
- Field: {node_field}
- Sector: {node_data.get('sector', 'Private')}

Their profile:
- Skills (with proficiency): {skills_info}
- Desired Field: {profile_data.get('desired_field', 'Unknown')}
- Education: {profile_data.get('education_level', 'Unknown')}

CRITICAL: All 3 options MUST stay inside the field "{node_field}". Do NOT pivot to Software Engineering / Technology unless the current node is already in that field.
Generate 3 possible DISTINCT next career steps in Pakistan within that field. Cover different directions (e.g., promotion, sector switch, specialization, entrepreneurship/private practice, abroad/remote).
ALL salaries in PKR monthly.
Return ONLY valid JSON (no markdown):
{{
    "options": [
        {{
            "id": "opt_1",
            "optionName": "Option Title",
            "jobTitle": "New Job Title",
            "salary": 160000,
            "timeline": "In 2 years",
            "description": "Brief description in Pakistani context",
            "requiredSkills": [
                {{"name": "Skill Name", "level": "intermediate"}}
            ],
            "sector": "Private",
            "likelihood": "High",
            "confidenceScore": 78
        }}
    ]
}}
"""

    raw = _call_llm(prompt)
    if not raw:
        return get_mock_fork_options(node_data, profile_data)

    return _parse_json_response(raw, get_mock_fork_options(node_data, profile_data))


# Mock data for when Gemini API is not available
def get_mock_career_path(profile_data):
    """Returns mock career path data"""
    job = profile_data.get('current_job', 'Software Developer')
    field = profile_data.get("desired_field", "Technology & IT")

    return {
        "rootNode": {
            "id": "node_1",
            "jobTitle": job,
            "salary": 80000,
            "timeline": "Current",
            "description": f"Starting position in {field} — Pakistan",
            "careerField": field,
            "children": [],
        }
    }


def get_mock_fork_options(node_data, profile_data=None):
    """Returns mock fork options in PKR — keeps the user's career field intact
    and personalises requiredSkills with the user's actual skills + field hints
    so two users in different fields never see the same chips."""
    current_salary = _coerce_int(node_data.get("salary"), 80000)
    title = _clean_job_title(node_data.get("jobTitle", "Professional"))
    field = node_data.get("careerField") or (profile_data or {}).get(
        "desired_field"
    ) or "your field"

    management_skills = _build_required_skills(
        profile_data,
        field,
        [
            {"name": "Team Leadership", "level": "intermediate"},
            {"name": "Project Coordination", "level": "intermediate"},
        ],
        variant_index=0,
    )
    specialisation_skills = _build_required_skills(
        profile_data,
        field,
        [{"name": f"Advanced {field} Practice", "level": "expert"}],
        variant_index=1,
    )
    independent_skills = _build_required_skills(
        profile_data,
        field,
        [
            {"name": "Client Acquisition", "level": "intermediate"},
            {"name": "Self-Management", "level": "expert"},
        ],
        variant_index=2,
    )

    return {
        "options": [
            {
                "id": "opt_1",
                "optionName": "Management Track",
                "jobTitle": _clean_job_title(f"{title} Team Lead"),
                "careerField": field,
                "salary": int(current_salary * 1.35),
                "timeline": "In 2 years",
                "description": (
                    f"Lead a team within {field} at a Pakistani organisation, "
                    "owning delivery and people management for the function."
                ),
                "requiredSkills": management_skills,
                "sector": "Private",
                "likelihood": "Medium",
                "confidenceScore": 72,
            },
            {
                "id": "opt_2",
                "optionName": "Specialisation Track",
                "jobTitle": _clean_job_title(f"Senior {title}"),
                "careerField": field,
                "salary": int(current_salary * 1.25),
                "timeline": "In 1.5 years",
                "description": (
                    f"Deepen expertise in {field} and become a recognised "
                    "subject-matter expert in Pakistan."
                ),
                "requiredSkills": specialisation_skills,
                "sector": "Private",
                "likelihood": "High",
                "confidenceScore": 80,
            },
            {
                "id": "opt_3",
                "optionName": "Independent / Consulting Track",
                "jobTitle": _clean_job_title(f"Independent {title}"),
                "careerField": field,
                "salary": int(current_salary * 2.0),
                "timeline": "In 1 year",
                "description": (
                    f"Move into independent practice or consulting within {field} "
                    "(private practice, freelance contracts, or boutique firm)."
                ),
                "requiredSkills": independent_skills,
                "sector": "Freelance",
                "likelihood": "High",
                "confidenceScore": 75,
            },
        ]
    }
