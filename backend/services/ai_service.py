import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=API_KEY)


def _call_groq(prompt: str, retries: int = 3) -> str:
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

    raw = _call_groq(prompt)
    try:
        return _parse_json(raw)
    except json.JSONDecodeError:
        return {"overview": "Roadmap generated successfully.", "weeks": [], "raw": raw}


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
