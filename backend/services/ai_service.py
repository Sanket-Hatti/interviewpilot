import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
MODEL  = "llama-3.3-70b-versatile"   # Fast, free, capable


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


def _parse_json(raw: str) -> dict | list:
    """Strip markdown fences and parse JSON safely."""
    raw = raw.replace("```json", "").replace("```", "").strip()
    # Find first { or [
    for i, ch in enumerate(raw):
        if ch in "{[":
            raw = raw[i:]
            break
    return json.loads(raw)


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


def generate_interview_questions(role: str, difficulty: str) -> dict:
    prompt = f"""Generate interview questions for a {role} position at {difficulty} difficulty.

Return ONLY this JSON, no explanation:
{{
  "technical": ["q1", "q2", "q3", "q4", "q5"],
  "behavioral": ["q1", "q2", "q3"],
  "hr": ["q1", "q2", "q3"]
}}"""

    raw = _call_groq(prompt)
    try:
        return _parse_json(raw)
    except json.JSONDecodeError:
        return {"technical": [], "behavioral": [], "hr": [], "raw": raw}


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
        return {"overall_score": 0, "technical_accuracy": 0, "communication": 0,
                "completeness": 0, "detailed_feedback": [], "suggested_improvements": []}


def chat_with_ai(message: str, history: list) -> str:
    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-6:]])
    prompt = f"""You are InterviewPilot AI, a career coach helping students with resume analysis, interview prep, learning roadmaps, and skill gaps. Be helpful, concise, and encouraging.

{history_str}
USER: {message}

Give a helpful response in 2-4 sentences."""
    return _call_groq(prompt)
