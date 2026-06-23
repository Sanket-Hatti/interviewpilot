import os
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-1.5-flash")


def _call_gemini(prompt: str, retries: int = 3) -> str:
    """Call Gemini with retry logic."""
    for attempt in range(retries):
        try:
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f"Gemini API error: {str(e)}")


def improve_resume_bullet(bullet: str) -> str:
    prompt = f"""You are an expert resume writer. Improve this resume bullet point to be more impactful, 
specific, and professional. Use strong action verbs and quantify achievements where possible.
Keep it to 1-2 sentences maximum.

Original bullet: {bullet}

Return ONLY the improved bullet point, nothing else."""
    return _call_gemini(prompt)


def generate_roadmap(target_role: str, missing_skills: list, weekly_hours: int, duration_weeks: int) -> dict:
    skills_str = ", ".join(missing_skills) if missing_skills else "general software development skills"
    prompt = f"""Create a detailed {duration_weeks}-week learning roadmap for someone targeting a {target_role} position.
They need to learn: {skills_str}
They can study {weekly_hours} hours per week.

Return a JSON object with this exact structure (no markdown, pure JSON):
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
}}"""
    import json
    raw = _call_gemini(prompt)
    # Strip markdown code blocks if present
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"overview": "Roadmap generated", "raw": raw, "weeks": []}


def generate_interview_questions(role: str, difficulty: str) -> dict:
    prompt = f"""Generate a mock interview question set for a {role} position at {difficulty} difficulty.

Return pure JSON (no markdown):
{{
  "technical": ["question1", "question2", "question3", "question4", "question5"],
  "behavioral": ["question1", "question2", "question3"],
  "hr": ["question1", "question2", "question3"]
}}"""
    import json
    raw = _call_gemini(prompt)
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"technical": [], "behavioral": [], "hr": [], "raw": raw}


def evaluate_interview_answers(role: str, questions: list, answers: list) -> dict:
    qa_pairs = "\n".join([f"Q: {q}\nA: {a}" for q, a in zip(questions, answers)])
    prompt = f"""Evaluate these interview answers for a {role} position.

{qa_pairs}

Return pure JSON (no markdown):
{{
  "overall_score": 75,
  "technical_accuracy": 70,
  "communication": 80,
  "completeness": 75,
  "detailed_feedback": ["feedback point 1", "feedback point 2", "feedback point 3"],
  "suggested_improvements": ["improvement 1", "improvement 2"]
}}"""
    import json
    raw = _call_gemini(prompt)
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"overall_score": 0, "raw": raw}


def chat_with_ai(message: str, history: list) -> str:
    history_str = ""
    for msg in history[-6:]:  # Last 6 messages for context
        history_str += f"{msg['role'].upper()}: {msg['content']}\n"

    prompt = f"""You are InterviewPilot AI, a career coach helping students with:
- Resume analysis and improvement
- Interview preparation
- Learning roadmaps
- Skill gap analysis
- Job search strategies

Conversation history:
{history_str}

User: {message}

Give a helpful, concise, and encouraging response (2-4 sentences max unless a detailed list is needed)."""
    return _call_gemini(prompt)
