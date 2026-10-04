import re
from services.resume_service import SKILL_KEYWORDS
from services.ai_service import generate_json_response

def analyze_job_description(job_description: str, target_role: str = "") -> dict:
    """
    Extract required skills, preferred skills, responsibilities, and likely interview topics.
    Uses AI extraction with a deterministic keyword-matching fallback.
    """
    jd_clean = (job_description or "").strip()
    
    # If job description is minimal or empty, return baseline role expectations
    if len(jd_clean) < 30:
        return _fallback_role_expectations(target_role)

    # Attempt AI extraction
    prompt = f"""You are an expert technical recruiter and interviewer.
Analyze this job description for the role "{target_role}":

JOB DESCRIPTION:
{jd_clean[:3000]}

Extract the required technical skills, preferred/bonus skills, and 4-6 likely interview technical topics.
Return ONLY a JSON object in this exact format:
{{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3", "skill4"],
  "responsibilities": ["brief responsibility 1", "brief responsibility 2"],
  "interview_topics": ["topic 1", "topic 2", "topic 3"]
}}"""

    ai_result = generate_json_response(prompt)
    if isinstance(ai_result, dict) and ai_result.get("required_skills"):
        # Normalize skill casings
        req = [s.strip().title() for s in ai_result.get("required_skills", []) if s.strip()]
        pref = [s.strip().title() for s in ai_result.get("preferred_skills", []) if s.strip()]
        topics = [t.strip() for t in ai_result.get("interview_topics", []) if t.strip()]
        resp = [r.strip() for r in ai_result.get("responsibilities", []) if r.strip()]
        
        return {
            "required_skills": req[:15],
            "preferred_skills": pref[:10],
            "responsibilities": resp[:6],
            "interview_topics": topics[:8],
            "source": "ai_analysis"
        }

    # Deterministic fallback extraction using SKILL_KEYWORDS taxonomy
    return _deterministic_jd_extraction(jd_clean, target_role)


def _deterministic_jd_extraction(jd_text: str, target_role: str) -> dict:
    text_lower = jd_text.lower()
    found_skills = []
    
    for skill in SKILL_KEYWORDS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill.title())

    # Split into required vs preferred based on sections
    pref_pattern = r"(nice to have|preferred|bonus|plus|desirable)"
    lines = jd_text.split("\n")
    pref_skills = []
    req_skills = []
    in_pref = False

    for line in lines:
        if re.search(pref_pattern, line, re.IGNORECASE):
            in_pref = True
        for s in found_skills:
            if re.search(r"\b" + re.escape(s.lower()) + r"\b", line.lower()):
                if in_pref and s not in pref_skills:
                    pref_skills.append(s)
                elif not in_pref and s not in req_skills:
                    req_skills.append(s)

    # If all ended up in one or neither, partition cleanly
    if not req_skills and found_skills:
        req_skills = found_skills[:8]
        pref_skills = found_skills[8:14]

    # Generate topics based on matched skills
    topics = [f"{s} Fundamentals & Architecture" for s in req_skills[:4]]
    if "Rest Api" in req_skills or "Microservices" in req_skills:
        topics.append("Scalable REST API & Distributed System Design")
    if "Sql" in req_skills or "Postgresql" in req_skills:
        topics.append("SQL Query Optimization & Database Indexing")

    return {
        "required_skills": req_skills or [target_role or "Software Engineering"],
        "preferred_skills": pref_skills,
        "responsibilities": ["Design and develop software components", "Collaborate on system architecture"],
        "interview_topics": topics or ["System Architecture", "Problem Solving", "Code Quality"],
        "source": "deterministic_taxonomy"
    }


def _fallback_role_expectations(role_name: str) -> dict:
    r = (role_name or "Software Engineer").lower()
    if "backend" in r:
        req = ["Python", "SQL", "PostgreSQL", "REST API", "Git", "System Design"]
        pref = ["Docker", "AWS", "Redis", "Kafka"]
        topics = ["API Design & Idempotency", "Database Normalization & Indexing", "Concurrency & Threading", "Microservices Architecture"]
    elif "frontend" in r:
        req = ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind"]
        pref = ["Next.js", "Redux", "GraphQL", "Jest"]
        topics = ["Component Lifecycle & Hooks", "DOM Rendering & Web Vitals", "State Management", "CSS Grid & Flexbox"]
    elif "data" in r:
        req = ["Python", "SQL", "Pandas", "PostgreSQL", "Data Structures"]
        pref = ["Spark", "Airflow", "AWS", "Tableau"]
        topics = ["Complex SQL Queries & Window Functions", "Data Pipeline Architecture", "ETL Optimization", "Statistical Analysis"]
    else:
        req = ["Data Structures", "Algorithms", "Git", "REST API", "SQL", "Python"]
        pref = ["Docker", "Cloud", "CI/CD", "Linux"]
        topics = ["Algorithmic Problem Solving", "Object-Oriented Design", "Database Schemas", "System Reliability"]

    return {
        "required_skills": req,
        "preferred_skills": pref,
        "responsibilities": ["Design and develop scalable applications", "Participate in code reviews and architecture sessions"],
        "interview_topics": topics,
        "source": "role_benchmark"
    }


def calculate_skill_gap(candidate_skills: list, job_analysis: dict, candidate_projects: list = None, candidate_experience: list = None) -> dict:
    """
    Compare Candidate Profile with Job Requirements.
    Categorizes: Strong matches, Partial matches, and Missing (not detected).
    Calculates deterministic, transparent role match score with breakdown.
    """
    c_set = {str(s).lower().strip() for s in (candidate_skills or [])}
    req_list = job_analysis.get("required_skills", [])
    pref_list = job_analysis.get("preferred_skills", [])

    strong_matches = []
    missing_skills = []
    partial_matches = []

    # Evaluate Required Skills
    for skill in req_list:
        s_clean = skill.strip()
        s_lower = s_clean.lower()
        if s_lower in c_set:
            strong_matches.append(s_clean)
        elif any(s_lower in c or c in s_lower for c in c_set):
            partial_matches.append(s_clean)
        else:
            missing_skills.append(s_clean)

    # Evaluate Preferred Skills
    for skill in pref_list:
        s_clean = skill.strip()
        s_lower = s_clean.lower()
        if s_lower in c_set:
            if s_clean not in strong_matches:
                strong_matches.append(s_clean)
        elif any(s_lower in c or c in s_lower for c in c_set):
            if s_clean not in partial_matches:
                partial_matches.append(s_clean)
        else:
            if s_clean not in missing_skills:
                missing_skills.append(s_clean)

    # Component Scoring
    total_req = max(1, len(req_list))
    req_matched_count = len([s for s in strong_matches if s in req_list])
    req_partial_count = len([s for s in partial_matches if s in req_list])
    skills_score = round(min(100.0, ((req_matched_count + 0.5 * req_partial_count) / total_req) * 100), 1)

    total_pref = max(1, len(pref_list)) if pref_list else 1
    pref_matched_count = len([s for s in strong_matches if s in pref_list])
    preferred_score = round(min(100.0, (pref_matched_count / total_pref) * 100), 1) if pref_list else 100.0

    # Project Relevance Score
    proj_count = len(candidate_projects or [])
    projects_score = min(100.0, max(40.0, proj_count * 30.0))

    # Experience Relevance Score
    exp_count = len(candidate_experience or [])
    experience_score = min(100.0, max(40.0, exp_count * 25.0))

    # Overall Weighted Match
    overall = round(
        (0.50 * skills_score) +
        (0.20 * preferred_score) +
        (0.15 * projects_score) +
        (0.15 * experience_score),
        1
    )

    comparison = {
        "strong_matches": [
            {
                "skill": s,
                "candidate_level": "Strong",
                "requirement_level": "Required" if s in req_list else "Preferred",
                "notes": "Verified match in candidate profile."
            }
            for s in strong_matches
        ],
        "needs_improvement": [
            {
                "skill": s,
                "candidate_level": "Foundational",
                "requirement_level": "Required" if s in req_list else "Preferred",
                "notes": "Partial match detected; deeper interview practice recommended."
            }
            for s in partial_matches
        ],
        "missing": [
            {
                "skill": s,
                "candidate_level": "Not detected in resume",
                "requirement_level": "Required" if s in req_list else "Preferred",
                "notes": "Not detected in resume profile; prioritize during preparation."
            }
            for s in missing_skills
        ]
    }

    return {
        "match_score": overall,
        "match_breakdown": {
            "skills_match": skills_score,
            "preferred_skills": preferred_score,
            "projects_relevance": projects_score,
            "experience_relevance": experience_score,
        },
        "score_breakdown": {
            "skills_match": skills_score,
            "preferred_skills": preferred_score,
            "projects_relevance": projects_score,
            "experience_relevance": experience_score,
        },
        "strong_matches": strong_matches,
        "partial_matches": partial_matches,
        "missing_skills": missing_skills,
        "comparison": comparison,
        "total_required": len(req_list),
        "total_preferred": len(pref_list),
        "interview_topics": job_analysis.get("interview_topics", [])
    }
