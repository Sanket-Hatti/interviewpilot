import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=API_KEY, timeout=8.0)


def _call_groq(prompt: str, retries: int = 2) -> str:
    """Call Groq with retry logic."""
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2048,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"Groq API error: {str(e)}")


def stream_groq_response(prompt: str):
    """Stream response tokens from Groq for SSE."""
    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2048,
        stream=True,
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


def _parse_json(raw: str) -> dict | list:
    """Strip markdown fences and parse JSON safely."""
    raw = raw.replace("```json", "").replace("```", "").strip()
    for i, ch in enumerate(raw):
        if ch in "{[":
            raw = raw[i:]
            break
    return json.loads(raw)


def generate_json_response(prompt: str) -> dict | list | None:
    """Generate a structured JSON response from Groq."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content.strip()
        return _parse_json(content)
    except Exception:
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2048,
            )
            content = response.choices[0].message.content.strip()
            return _parse_json(content)
        except Exception:
            return None


def improve_resume_bullet(bullet: str) -> str:
    prompt = f"""You are an expert resume writer. Improve this resume bullet point to be more impactful, specific, and professional. Use strong action verbs and quantify achievements where possible. Keep it to 1-2 sentences maximum.

Original: {bullet}

Return ONLY the improved bullet point, nothing else."""
    return _call_groq(prompt)


def _generate_deterministic_roadmap(target_role: str, missing_skills: list, weekly_hours: int, duration_weeks: int) -> dict:
    """Deterministic fallback roadmap generator based on actual detected gaps."""
    clean_skills = [s.strip() for s in missing_skills if s and s.strip()]
    if not clean_skills:
        clean_skills = ["Core Algorithms & Data Structures", "System Design & Architecture", "Database Optimization", "Mock Interview Simulation"]

    weeks = []
    # Distribute skills across weeks
    num_skills = len(clean_skills)
    for w in range(1, duration_weeks + 1):
        if w == duration_weeks:
            # Final week is always integration + mock interview
            primary_topic = "Full-Scale Mock Interview & Final Architecture Review"
            topics = [
                f"{target_role} Technical System Design Drill",
                "STAR Behavioral Technique Review",
                "Live Coding Simulation & Time-bound Debugging",
                "Final Readiness Assessment"
            ]
            mini_proj = f"End-to-End {target_role} Capstone System with documentation and automated tests"
        else:
            skill_idx = (w - 1) % num_skills
            skill = clean_skills[skill_idx]
            primary_topic = f"{skill} Mastery & Real-World Application"
            topics = [
                f"{skill} Core Syntax, Internal Mechanics & Edge Cases",
                f"Production Patterns & Best Practices in {skill}",
                f"Common {skill} Technical Interview Questions & Trap Scenarios",
                f"Optimizing Performance & Scalability with {skill}"
            ]
            mini_proj = f"Hands-on {skill} micro-project demonstrating production-grade patterns"

        weeks.append({
            "week": w,
            "title": f"Week {w}: {primary_topic}",
            "topics": topics,
            "resources": [
                f"Official {target_role} & Language Documentation",
                "High-Yield Interview Problem Sets & Case Studies",
                "System Design Engineering Primer"
            ],
            "tasks": [
                f"Dedicate {weekly_hours // 2} hours to deep conceptual study and architecture patterns",
                f"Complete 5 targeted practice problems focusing on {topics[0]}",
                f"Build out the weekly milestone: {mini_proj}",
                "Review code quality, edge cases, and algorithmic complexity"
            ],
            "mini_project": mini_proj
        })

    overview = (
        f"A targeted {duration_weeks}-week curriculum designed for {target_role}, specifically prioritized "
        f"around your detected skill gaps ({', '.join(clean_skills[:4])}). Structured for {weekly_hours} hours of focused practice per week."
    )
    return {
        "overview": overview,
        "weeks": weeks
    }


def generate_roadmap(target_role: str, missing_skills: list, weekly_hours: int, duration_weeks: int) -> dict:
    skills_str = ", ".join(missing_skills) if missing_skills else "core software development skills"
    prompt = f"""Create a {duration_weeks}-week learning roadmap for a {target_role} position.
Skills to learn: {skills_str}
Study time: {weekly_hours} hours/week

Return ONLY a JSON object, no explanation, no markdown:
{{
  "overview": "brief overview string",
  "weeks": [
    {{
      "week": 1,
      "title": "week title",
      "topics": ["topic1", "topic2"],
      "resources": ["resource1", "resource2"],
      "tasks": ["task1", "task2"],
      "mini_project": "mini project description"
    }}
  ]
}}

Generate all {duration_weeks} weeks."""

    try:
        raw = _call_groq(prompt)
        parsed = _parse_json(raw)
        if isinstance(parsed, dict) and parsed.get("weeks") and len(parsed["weeks"]) > 0:
            return parsed
    except Exception:
        pass

    # High-quality fallback based on detected skill gaps
    return _generate_deterministic_roadmap(target_role, missing_skills, weekly_hours, duration_weeks)


DEFAULT_QUESTIONS = {
    "technical": [
        "Explain the difference between a process and a thread, and how concurrency is handled in your primary language.",
        "How does a hash map work internally, and what are its average and worst-case time complexities?",
        "Describe the differences between relational (SQL) and non-relational (NoSQL) databases, and when you would choose each.",
        "Explain the complete request-response lifecycle when a browser requests an endpoint over HTTPS.",
        "How do you design a REST API to ensure scalability, proper HTTP status codes, and idempotency?"
    ],
    "behavioral": [
        "Tell me about a challenging bug you encountered in a recent project. How did you diagnose and resolve it?",
        "Describe a situation where you disagreed with a peer or teammate on an architectural decision. How did you reach consensus?",
        "Give an example of a project where requirements changed close to a deadline. How did you prioritize?"
    ],
    "hr": [
        "What motivated you to pursue this role and what aspects of this engineering culture resonate with you?",
        "What are your greatest technical strengths, and what is one area you are actively learning to improve?",
        "Where do you see your engineering skills and career trajectory in the next 2-3 years?"
    ]
}


def generate_interview_questions(role: str, difficulty: str, company: str = None) -> dict:
    company_context = f" targeting {company}'s hiring standards" if company else ""
    prompt = f"""Generate 11 high-quality interview questions for a {role} position{company_context} at {difficulty} difficulty.
Include:
- 5 technical questions covering data structures, system fundamentals, and domain architecture.
- 3 behavioral questions using the STAR framework.
- 3 culture, work style, and HR questions.

Return ONLY this JSON object, no explanation, no markdown:
{{
  "technical": ["q1", "q2", "q3", "q4", "q5"],
  "behavioral": ["q1", "q2", "q3"],
  "hr": ["q1", "q2", "q3"]
}}"""

    try:
        raw = _call_groq(prompt)
        parsed = _parse_json(raw)
        if isinstance(parsed, dict) and parsed.get("technical"):
            return parsed
    except Exception:
        pass
        
    return DEFAULT_QUESTIONS


def evaluate_interview_answers(role: str, questions: list, answers: list) -> dict:
    qa_pairs = "\n".join([f"Q{i+1}: {q}\nA{i+1}: {a}" for i, (q, a) in enumerate(zip(questions, answers))])
    prompt = f"""Evaluate these interview answers for a {role} position.

{qa_pairs}

Return ONLY this JSON, no explanation:
{{
  "overall_score": 75,
  "technical_accuracy": 70,
  "communication": 80,
  "completeness": 75,
  "detailed_feedback": ["point1", "point2", "point3"],
  "suggested_improvements": ["improvement1", "improvement2"]
}}"""

    raw = _call_groq(prompt)
    try:
        return _parse_json(raw)
    except json.JSONDecodeError:
        return {
            "overall_score": 0,
            "technical_accuracy": 0,
            "communication": 0,
            "completeness": 0,
            "detailed_feedback": [],
            "suggested_improvements": []
        }


def chat_with_ai(message: str, history: list) -> str:
    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-6:]])
    prompt = f"""You are InterviewPilot AI, a career coach helping students with resume analysis, interview prep, learning roadmaps, and skill gaps. Be helpful, concise, and encouraging.

{history_str}
USER: {message}

Give a helpful response in 2-4 sentences."""
    return _call_groq(prompt)
