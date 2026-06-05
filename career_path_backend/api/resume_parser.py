# api/resume_parser.py
from pypdf import PdfReader
from docx import Document
import re

COMMON_SKILLS = [
    # Programming languages
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'php', 'ruby',
    'go', 'rust', 'kotlin', 'swift', 'scala', 'r', 'matlab', 'sql',
    # Web / frontend
    'html', 'css', 'react', 'angular', 'vue', 'next.js', 'tailwind', 'bootstrap',
    'jquery', 'redux', 'sass',
    # Backend / frameworks
    'django', 'flask', 'fastapi', 'node.js', 'express', 'spring', 'laravel',
    'rails', '.net', 'asp.net',
    # Databases
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'firebase', 'oracle',
    # DevOps / cloud
    'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux',
    'ci/cd', 'jenkins', 'nginx',
    # Data / AI
    'machine learning', 'deep learning', 'data analysis', 'data science',
    'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'nlp',
    'computer vision', 'excel', 'power bi', 'tableau',
    # Mobile
    'android', 'ios', 'flutter', 'react native',
    # Design
    'figma', 'photoshop', 'illustrator', 'ui/ux', 'adobe xd',
    # Soft skills
    'communication', 'leadership', 'teamwork', 'problem solving',
    'project management', 'agile', 'scrum', 'time management',
]


def extract_text(file_obj, filename):
    """Extract raw text from an uploaded PDF or DOCX file."""
    name = filename.lower()
    try:
        if name.endswith('.pdf'):
            reader = PdfReader(file_obj)
            return ' '.join((page.extract_text() or '') for page in reader.pages)
        if name.endswith('.docx'):
            doc = Document(file_obj)
            return ' '.join(p.text for p in doc.paragraphs)
    except Exception:
        return ''
    return ''


def parse_skills(text):
    """Find known skills inside raw resume text."""
    text_lower = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        if skill in text_lower and skill not in found:
            found.append(skill)
    return found


def _extract_education_level(text_lower):
    if "phd" in text_lower or "doctorate" in text_lower:
        return "PhD", 0.9
    if "master" in text_lower or "msc" in text_lower or "m.s." in text_lower:
        return "Master's", 0.85
    if "bachelor" in text_lower or "bsc" in text_lower or "b.s." in text_lower:
        return "Bachelor's", 0.82
    if "high school" in text_lower or "intermediate" in text_lower:
        return "High School", 0.75
    return None, 0.0


def _extract_years_experience(text_lower):
    patterns = [
        r"(\d{1,2})\+?\s*years?\s+of\s+experience",
        r"experience\s+of\s+(\d{1,2})\+?\s*years?",
        r"(\d{1,2})\+?\s*yrs?\s+experience",
    ]
    for pattern in patterns:
        match = re.search(pattern, text_lower)
        if match:
            years = int(match.group(1))
            return years, 0.8
    return None, 0.0


def _extract_current_role(text):
    role_patterns = [
        r"(?im)^\s*(?:current\s+)?(?:role|position|title)\s*:\s*([^\n\r]{3,80})",
        r"(?im)^\s*([A-Za-z][A-Za-z\s\-/]{2,60}(?:Engineer|Developer|Designer|Manager|Analyst|Consultant|Specialist))\s*$",
    ]
    for pattern in role_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip(), 0.72
    return None, 0.0


def _extract_desired_fields(skills):
    skills_lower = {s.lower() for s in skills}
    suggestions = []

    if {
        "machine learning",
        "deep learning",
        "nlp",
        "tensorflow",
        "pytorch",
    } & skills_lower:
        suggestions.append("Artificial Intelligence")
    if {"react", "javascript", "typescript", "html", "css"} & skills_lower:
        suggestions.append("Frontend Engineering")
    if {"django", "flask", "fastapi", "node.js", "express", "sql"} & skills_lower:
        suggestions.append("Backend Engineering")
    if {"aws", "azure", "gcp", "docker", "kubernetes", "ci/cd"} & skills_lower:
        suggestions.append("Cloud & DevOps")
    if {"tableau", "power bi", "excel", "pandas", "data analysis"} & skills_lower:
        suggestions.append("Data Analytics")

    return suggestions[:3]


def parse_resume_profile(text):
    """Extract structured profile hints from resume text.

    Returns a dict with extracted fields, confidence scores, and unresolved fields.
    """
    text_lower = text.lower()
    skills = parse_skills(text)

    education_level, education_confidence = _extract_education_level(text_lower)
    years_experience, experience_confidence = _extract_years_experience(text_lower)
    current_job, role_confidence = _extract_current_role(text)
    desired_field_suggestions = _extract_desired_fields(skills)

    extracted = {
        "education_level": education_level,
        "years_experience": years_experience,
        "current_job": current_job,
        "desired_field_suggestions": desired_field_suggestions,
        "skills": skills,
        "skills_with_levels": {skill: "basic" for skill in skills},
    }

    confidence = {
        "education_level": education_confidence,
        "years_experience": experience_confidence,
        "current_job": role_confidence,
        "skills": 0.82 if skills else 0.0,
        "desired_field_suggestions": 0.65 if desired_field_suggestions else 0.0,
    }

    unresolved_fields = [
        key
        for key in ["education_level", "years_experience", "current_job", "skills"]
        if not extracted.get(key)
    ]

    return {
        "extracted": extracted,
        "confidence": confidence,
        "unresolved_fields": unresolved_fields,
    }
