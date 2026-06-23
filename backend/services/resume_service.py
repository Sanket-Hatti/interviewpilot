import os
import re
import fitz  # PyMuPDF
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError("Run: python -m spacy download en_core_web_sm")

SKILL_KEYWORDS = {
    "python", "java", "javascript", "typescript", "c", "c++", "c#", "go",
    "rust", "kotlin", "swift", "ruby", "php", "scala", "r", "matlab",
    "react", "vue", "angular", "html", "css", "tailwind", "bootstrap",
    "next.js", "nuxt", "svelte", "redux", "jquery",
    "flask", "django", "fastapi", "node.js", "express", "spring", "spring boot",
    "laravel", "rails", "asp.net",
    "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle",
    "cassandra", "dynamodb", "firebase", "supabase",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
    "jenkins", "github actions", "ci/cd", "linux", "nginx",
    "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
    "scikit-learn", "pandas", "numpy", "matplotlib", "opencv", "nlp",
    "computer vision", "hugging face", "langchain",
    "git", "github", "gitlab", "jira", "postman", "figma",
    "rest api", "graphql", "websocket", "microservices", "agile", "scrum",
    "sql", "tableau", "power bi", "excel", "spark", "hadoop", "airflow",
}

SECTION_PATTERNS = {
    "experience": r"(work\s+experience|professional\s+experience|experience|employment)",
    "education":  r"(education|academic|qualification)",
    "projects":   r"(projects?|personal\s+projects?|academic\s+projects?)",
    "skills":     r"(skills?|technical\s+skills?|core\s+competencies|technologies)",
}


def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()


def extract_skills(text):
    text_lower = text.lower()
    found = set()
    for skill in SKILL_KEYWORDS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found.add(skill)
    return sorted(list(found))


def extract_section(text, section_key):
    pattern = SECTION_PATTERNS.get(section_key, "")
    if not pattern:
        return []
    lines = text.split("\n")
    in_section = False
    items = []
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        if re.search(pattern, line_stripped, re.IGNORECASE):
            in_section = True
            continue
        if in_section:
            is_other = any(
                re.search(p, line_stripped, re.IGNORECASE)
                for k, p in SECTION_PATTERNS.items() if k != section_key
            )
            if is_other:
                break
            if len(line_stripped) > 10:
                items.append(line_stripped)
    return items[:10]


def extract_education(text):
    items = extract_section(text, "education")
    degree_pattern = r"(b\.?tech|b\.?e|m\.?tech|m\.?e|bsc|msc|bca|mca|phd|bachelor|master|degree)"
    for line in text.split("\n"):
        if re.search(degree_pattern, line, re.IGNORECASE) and line.strip() not in items:
            items.append(line.strip())
    return list(dict.fromkeys(items))[:5]


def calculate_resume_score(text, skills, experience_items, education_items, projects):
    scores = {}
    scores["skills"]       = min(30, len(skills) * 2)
    scores["experience"]   = min(25, len(experience_items) * 5)
    scores["education"]    = 20 if education_items else 0
    scores["projects"]     = min(15, len(projects) * 5)
    scores["completeness"] = min(10, len(text.split()) // 50)
    total = sum(scores.values())

    strengths, weaknesses = [], []
    if scores["skills"] >= 20:
        strengths.append("Strong technical skill set detected")
    else:
        weaknesses.append("Add more technical skills to improve visibility")
    if scores["experience"] >= 15:
        strengths.append("Good work experience section")
    else:
        weaknesses.append("Expand experience with quantified achievements")
    if scores["education"] > 0:
        strengths.append("Education details present")
    else:
        weaknesses.append("Add your education details")
    if scores["projects"] >= 10:
        strengths.append("Multiple projects showcase practical skills")
    else:
        weaknesses.append("Add more projects to demonstrate hands-on experience")
    if len(text.split()) > 300:
        strengths.append("Resume has good content depth")
    else:
        weaknesses.append("Resume is too short — add more detail")

    return {"total": round(total, 1), "breakdown": scores,
            "strengths": strengths, "weaknesses": weaknesses}


def analyze_resume(file_path):
    raw_text = extract_text_from_pdf(file_path)
    if not raw_text or len(raw_text) < 50:
        raise ValueError("Could not extract text. Ensure PDF is not image-based.")
    skills     = extract_skills(raw_text)
    experience = extract_section(raw_text, "experience")
    education  = extract_education(raw_text)
    projects   = extract_section(raw_text, "projects")
    score_data = calculate_resume_score(raw_text, skills, experience, education, projects)
    return {
        "raw_text":         raw_text[:5000],
        "extracted_skills": skills,
        "experience":       experience,
        "education":        education,
        "projects":         projects,
        "resume_score":     score_data["total"],
        "strengths":        score_data["strengths"],
        "weaknesses":       score_data["weaknesses"],
        "score_breakdown":  score_data["breakdown"],
    }
