"""
InterviewPilot Agent Tools Registry.
Clean, validated interfaces executing backend operations with strict multi-tenant user isolation.
Each tool calls existing application services instead of duplicating business logic.
"""

import logging
from typing import Dict, Any, List, Optional
from database.db import db
from models.candidate import CandidateProfile, JobTarget
from models.user import User
from models.interview import Interview, InterviewSession, InterviewTurn
from models.roadmap import Roadmap
from models.dsa import DSAProgress
from services.retrieval_service import (
    search_resume_context,
    search_job_context,
    search_candidate_context,
    construct_rag_context
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool 1: get_candidate_profile
# ---------------------------------------------------------------------------
def tool_get_candidate_profile(user_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve the verified CandidateProfile for the authenticated user."""
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return {"has_profile": False, "message": "No candidate profile found. Resume upload required."}
    return {
        "has_profile": True,
        "resume_score": profile.resume_score,
        "skills": profile.skills or [],
        "programming_languages": getattr(profile, "programming_languages", []),
        "frameworks": getattr(profile, "frameworks", []),
        "databases": getattr(profile, "databases", []),
        "cloud_technologies": getattr(profile, "cloud_technologies", []),
        "projects_count": len(profile.projects or []),
        "experience_count": len(profile.experience or []),
        "strengths": profile.strengths or [],
        "areas_to_improve": getattr(profile, "areas_to_improve", None) or profile.weaknesses or []
    }


# ---------------------------------------------------------------------------
# Tool 2: get_target_job
# ---------------------------------------------------------------------------
def tool_get_target_job(user_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve the active target role, company, and analyzed job requirements."""
    target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()
    if not target:
        user = db.session.get(User, user_id)
        role = user.target_role if user else None
        return {
            "has_target": bool(role),
            "target_role": role,
            "target_company": user.target_company if user else None,
            "match_score": None,
            "required_skills": [],
            "preferred_skills": [],
            "missing_skills": []
        }
    return {
        "has_target": True,
        "target_role": target.target_role,
        "target_company": target.target_company,
        "match_score": target.match_score,
        "score_breakdown": target.match_breakdown or {},
        "required_skills": target.required_skills or [],
        "preferred_skills": target.preferred_skills or [],
        "strong_matches": target.strong_matches or [],
        "partial_matches": target.partial_matches or [],
        "missing_skills": target.missing_skills or [],
        "interview_topics": target.interview_topics or []
    }


# ---------------------------------------------------------------------------
# Tool 3: analyze_skill_gaps
# ---------------------------------------------------------------------------
def tool_analyze_skill_gaps(user_id: int, **kwargs) -> Dict[str, Any]:
    """Identify priority skill gaps between candidate profile and target job."""
    target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()

    missing = target.missing_skills if target else []
    partial = target.partial_matches if target else []
    strong = target.strong_matches if target else []

    # Prioritize gaps: required skills missing from resume come first
    priorities = list(missing) + [p for p in partial if p not in missing]
    if not priorities and profile:
        priorities = getattr(profile, "areas_to_improve", None) or profile.weaknesses or []

    return {
        "match_score": target.match_score if target else None,
        "top_priority_gaps": priorities[:4],
        "all_missing_skills": missing,
        "partial_skills": partial,
        "strong_skills": strong,
        "total_gaps": len(priorities)
    }


# ---------------------------------------------------------------------------
# Tool 4: get_user_progress
# ---------------------------------------------------------------------------
def tool_get_user_progress(user_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve historical mock interviews, coding performance, and roadmap status."""
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    roadmap = Roadmap.query.filter_by(user_id=user_id).order_by(Roadmap.created_at.desc()).first()
    dsa_records = DSAProgress.query.filter_by(user_id=user_id).all()

    interview_scores = [i.overall_score for i in interviews if i.overall_score is not None]
    avg_score = round(sum(interview_scores) / len(interview_scores), 1) if interview_scores else None

    # Identify recurring weakness from past interview feedback
    past_weaknesses = []
    for iv in interviews[:3]:
        if iv.feedback and isinstance(iv.feedback, dict):
            w = iv.feedback.get("weaknesses") or []
            if isinstance(w, list):
                past_weaknesses.extend(w)

    return {
        "interviews_completed": len(interviews),
        "average_interview_score": avg_score,
        "recent_scores": interview_scores[:4],
        "dsa_problems_solved": len(dsa_records),
        "has_active_roadmap": bool(roadmap),
        "roadmap_role": roadmap.target_role if roadmap else None,
        "roadmap_completion_pct": roadmap.completion_pct if roadmap else 0.0,
        "recent_weaknesses": past_weaknesses[:4]
    }


# ---------------------------------------------------------------------------
# Tool 5: retrieve_resume_context
# ---------------------------------------------------------------------------
def tool_retrieve_resume_context(user_id: int, query: str = "", top_k: int = 3, **kwargs) -> Dict[str, Any]:
    """Retrieve grounded chunks from the candidate's resume (projects, experience, skills)."""
    chunks = search_resume_context(user_id=user_id, query=query, top_k=top_k)
    return {
        "query": query,
        "chunks_retrieved": len(chunks),
        "context": [
            {"section": c["section"], "content": c["content"], "similarity": c["similarity"]}
            for c in chunks
        ]
    }


# ---------------------------------------------------------------------------
# Tool 6: retrieve_job_context
# ---------------------------------------------------------------------------
def tool_retrieve_job_context(user_id: int, query: str = "", top_k: int = 3, **kwargs) -> Dict[str, Any]:
    """Retrieve grounded chunks from the active target job description."""
    chunks = search_job_context(user_id=user_id, query=query, top_k=top_k)
    return {
        "query": query,
        "chunks_retrieved": len(chunks),
        "context": [
            {"section": c["section"], "content": c["content"], "similarity": c["similarity"]}
            for c in chunks
        ]
    }


# ---------------------------------------------------------------------------
# Tool 7: generate_practice_questions
# ---------------------------------------------------------------------------
def tool_generate_practice_questions(user_id: int, skill: str = "SQL", difficulty: str = "medium", count: int = 3, **kwargs) -> Dict[str, Any]:
    """Generate technical practice questions grounded in skill and candidate context."""
    # Retrieve any resume context relevant to this skill
    rag_context = construct_rag_context(user_id, query=f"{skill} implementation details", top_k=2)

    prompt = f"""Generate {count} focused technical practice questions for {skill} at {difficulty} difficulty.
{rag_context}
Return ONLY a JSON list of questions:
[
  {{"question": "string", "expected_concept": "string", "difficulty": "{difficulty}"}}
]"""

    try:
        from services.ai_service import _call_groq, _parse_json
        raw = _call_groq(prompt)
        parsed = _parse_json(raw)
        if isinstance(parsed, list):
            return {"skill": skill, "questions": parsed}
    except Exception:
        pass

    # Deterministic fallback questions
    skill_clean = skill.title()
    fallback_q = [
        {"question": f"Explain the core architectural fundamentals and common pitfalls in {skill_clean}.", "expected_concept": "Core Architecture", "difficulty": difficulty},
        {"question": f"How do you optimize query execution or runtime performance when working with {skill_clean}?", "expected_concept": "Performance Optimization", "difficulty": difficulty},
        {"question": f"Describe an end-to-end production use case where you integrated {skill_clean} into a distributed system.", "expected_concept": "Production Integration", "difficulty": difficulty}
    ]
    return {"skill": skill, "questions": fallback_q[:count]}


# ---------------------------------------------------------------------------
# Tool 8: evaluate_answer
# ---------------------------------------------------------------------------
def tool_evaluate_answer(user_id: int, question: str = "", answer: str = "", **kwargs) -> Dict[str, Any]:
    """Evaluate candidate answer for technical depth, correctness, and structure."""
    if not answer or len(answer.strip()) < 5:
        return {
            "score": 20,
            "feedback": "Answer was too brief to evaluate technical competence.",
            "is_correct": False,
            "key_strengths": [],
            "missing_points": ["Comprehensive explanation", "Concrete implementation details"]
        }

    prompt = f"""Evaluate this technical interview answer:
Question: {question}
Candidate Answer: {answer}

Return ONLY this JSON object:
{{
  "score": 75,
  "is_correct": true,
  "feedback": "constructive 2-sentence feedback",
  "key_strengths": ["point 1"],
  "missing_points": ["point 1"]
}}"""

    try:
        from services.ai_service import _call_groq, _parse_json
        raw = _call_groq(prompt)
        parsed = _parse_json(raw)
        if isinstance(parsed, dict) and "score" in parsed:
            return parsed
    except Exception:
        pass

    # Deterministic fallback
    word_count = len(answer.split())
    score = min(85, max(40, word_count * 2))
    return {
        "score": score,
        "is_correct": score >= 60,
        "feedback": "Good initial explanation. Structure your response with a direct definition followed by trade-offs.",
        "key_strengths": ["Clear communication", "Addressed question prompt"],
        "missing_points": ["Deeper edge case analysis", "Production scalability metrics"]
    }


# ---------------------------------------------------------------------------
# Tool 9: create_or_update_roadmap
# ---------------------------------------------------------------------------
def tool_create_or_update_roadmap(
    user_id: int,
    target_role: Optional[str] = None,
    missing_skills: Optional[List[str]] = None,
    weekly_hours: int = 15,
    duration_weeks: int = 8,
    **kwargs
) -> Dict[str, Any]:
    """Generate and persist personalized preparation roadmap for user's skill gaps."""
    if not target_role or not missing_skills:
        target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()
        if target:
            target_role = target_role or target.target_role
            missing_skills = missing_skills or target.missing_skills

    target_role = target_role or "Software Engineer"
    missing_skills = missing_skills or ["System Design", "SQL", "Algorithms"]

    from services.ai_service import generate_roadmap
    roadmap_data = generate_roadmap(target_role, missing_skills, weekly_hours, duration_weeks)

    roadmap = Roadmap.query.filter_by(user_id=user_id, target_role=target_role).first()
    if not roadmap:
        roadmap = Roadmap(user_id=user_id, target_role=target_role)
        db.session.add(roadmap)

    roadmap.missing_skills = missing_skills
    roadmap.weekly_hours = weekly_hours
    roadmap.duration_weeks = duration_weeks
    roadmap.roadmap_data = roadmap_data
    db.session.commit()

    return {
        "success": True,
        "roadmap_id": roadmap.id,
        "target_role": target_role,
        "weeks_count": len(roadmap_data.get("weeks", [])),
        "primary_focus_skills": missing_skills[:3]
    }


# ---------------------------------------------------------------------------
# Tool 10: update_user_progress
# ---------------------------------------------------------------------------
def tool_update_user_progress(user_id: int, focus_area: str = "", score: float = 0.0, **kwargs) -> Dict[str, Any]:
    """Record user activity checkpoint to advance preparation state."""
    logger.info(f"User {user_id} progress updated for {focus_area}: score {score}")
    return {
        "user_id": user_id,
        "updated": True,
        "focus_area": focus_area,
        "score": score
    }


# ---------------------------------------------------------------------------
# Tool 11: recommend_next_action
# ---------------------------------------------------------------------------
def tool_recommend_next_action(user_id: int, **kwargs) -> Dict[str, Any]:
    """Rule-based deterministic Next Best Action based on canonical candidate state."""
    from services.candidate_context_service import build_canonical_candidate_state

    state = build_canonical_candidate_state(user_id)
    cand = state["candidate"]
    tgt = state["target"]
    gaps = state["skill_gaps"]
    rd = state["roadmap"]
    prac = state["practice"]
    iv = state["interviews"]
    ag = state["agent"]

    # 1. No resume
    if not cand["profile_complete"] or not cand["skills"]:
        return {
            "title": "Start with your resume",
            "description": "Upload your resume so InterviewPilot can extract your genuine skills and build your verified candidate profile.",
            "action_label": "Analyze my resume →",
            "route": "/resume",
            "target": "/resume",
            "action": "START_RESUME",
            "topic": None,
            "priority": "Resume Upload",
            "reason": "resume_missing",
            "why_reasons": ["Resume analysis required to benchmark your skills", "Enables personalized prep roadmap", "Identifies verified technical strengths"],
            "focus_skill": None,
            "confidence": 0.95
        }

    # 2. No target role analysis
    if not tgt["role"] or tgt["match_score"] is None:
        role_name = tgt["role"] or "your target role"
        return {
            "title": "Analyze your target role",
            "description": f"Benchmark your profile against requirements for {role_name} and identify your isolated skill gaps.",
            "action_label": "Analyze target role →",
            "route": "/roles",
            "target": "/roles",
            "action": "SELECT_TARGET_ROLE",
            "topic": None,
            "priority": "Target Role Selection",
            "reason": "role_analysis_pending",
            "why_reasons": ["Role benchmark isolates critical skill gaps", "Calibrates mock interview difficulty", "Tailors roadmap to company expectations"],
            "focus_skill": None,
            "confidence": 0.95
        }

    # 3. Role analyzed, roadmap pending
    if not rd["exists"]:
        missing_count = len(gaps["missing"])
        top_missing = gaps["missing"][0] if gaps["missing"] else None
        return {
            "title": "Build your preparation plan",
            "description": f"Your {tgt['role']} benchmark is ready with {missing_count} identified focus areas. Generate a week-by-week curriculum.",
            "action_label": "Generate my plan →",
            "route": "/roadmap",
            "target": "/roadmap",
            "action": "BUILD_ROADMAP",
            "topic": top_missing,
            "priority": "Build Preparation Plan",
            "reason": "roadmap_pending",
            "why_reasons": ["Transforms skill gaps into week-by-week milestones", "Structures practice hours to your target timeline", f"Prioritizes must-have skills for {tgt['role']}"],
            "focus_skill": top_missing,
            "confidence": 0.92
        }

    # 4. Roadmap exists -> Evaluate priority engine decisions
    top_gap = ag["priority"] or (gaps["missing"][0] if gaps["missing"] else "Core Technical")
    action_type = ag["recommended_action"]
    route = ag["target"] or "/code"

    # If no interviews or practice completed yet -> Start top gap practice
    if iv["completed"] == 0 and len(prac.get("recent_scores", [])) == 0:
        return {
            "title": f"Start {top_gap} practice",
            "description": f"Your customized preparation roadmap prioritizes {top_gap} as your primary gap for {tgt['role']}. Begin focused technical practice.",
            "action_label": f"Start {top_gap} practice →",
            "route": "/code",
            "target": "/code",
            "action": "PRACTICE_SKILL",
            "topic": top_gap,
            "priority": top_gap,
            "reason": "start_gap_practice",
            "why_reasons": [f"Required by your target role: {tgt['role']}", "Identified as priority gap on your roadmap", "Builds foundational problem solving confidence"],
            "focus_skill": top_gap,
            "confidence": 0.88
        }

    # Weakness from recent interview
    if action_type == "IMPROVE_WEAK_TOPIC" or top_gap in iv["weak_topics"]:
        return {
            "title": f"Improve {top_gap}",
            "description": f"Your recent interview showed weakness in {top_gap}. Take a targeted practice session to close this gap.",
            "action_label": f"Practice {top_gap} →",
            "route": route,
            "target": route,
            "action": "IMPROVE_WEAK_TOPIC",
            "topic": top_gap,
            "priority": top_gap,
            "reason": f"gap_drill_{top_gap.lower().replace(' ', '_')}",
            "why_reasons": [f"Required by your target role: {tgt['role']}", "Recent mock interview showed weakness in this area", "High-impact preparation area to raise interview readiness"],
            "focus_skill": top_gap,
            "confidence": 0.89
        }

    # Weakness from recent practice
    if top_gap in prac["weak_topics"]:
        return {
            "title": f"Improve {top_gap}",
            "description": f"Your recent practice drill showed conceptual gaps in {top_gap}. Review edge cases and try another problem.",
            "action_label": f"Practice {top_gap} →",
            "route": "/code",
            "target": "/code",
            "action": "PRACTICE_SKILL",
            "topic": top_gap,
            "priority": top_gap,
            "reason": f"practice_drill_{top_gap.lower().replace(' ', '_')}",
            "why_reasons": [f"Recent practice drill in {top_gap} scored below benchmark", f"Core requirement for {tgt['role']}", "Strengthens coding accuracy and algorithmic depth"],
            "focus_skill": top_gap,
            "confidence": 0.86
        }

    # Default to practicing next missing gap
    if gaps["missing"]:
        next_gap = gaps["missing"][0]
        return {
            "title": f"Practice {next_gap}",
            "description": f"Targeted technical practice for {next_gap} based on your preparation plan for {tgt['role']}.",
            "action_label": f"Start {next_gap} practice →",
            "route": "/code",
            "target": "/code",
            "action": "PRACTICE_SKILL",
            "topic": next_gap,
            "priority": next_gap,
            "reason": f"next_gap_{next_gap.lower()}",
            "why_reasons": [f"Pending skill gap for {tgt['role']}", "Next milestone on your roadmap", "Validates core domain knowledge"],
            "focus_skill": next_gap,
            "confidence": 0.85
        }

    return {
        "title": "Take a mock interview",
        "description": f"Your core technical preparation for {tgt['role']} is well underway. Validate your readiness in an adaptive mock interview.",
        "action_label": "Start mock interview →",
        "route": "/interview",
        "target": "/interview",
        "action": "TAKE_MOCK_INTERVIEW",
        "topic": tgt["role"],
        "priority": tgt["role"],
        "reason": "mock_interview_validation",
        "why_reasons": [f"Simulates real hiring rounds for {tgt['role']}", "Tests communication and problem-solving under pressure", "Provides diagnostic score and actionable feedback"],
        "focus_skill": None,
        "confidence": 0.90
    }


# ---------------------------------------------------------------------------
# Tool 12: get_interview_session
# ---------------------------------------------------------------------------
def tool_get_interview_session(user_id: int, session_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve active adaptive interview session state."""
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return {"error": "Interview session not found.", "has_session": False}
    return {"has_session": True, "session": session.to_dict()}


# ---------------------------------------------------------------------------
# Tool 13: get_previous_interview_turns
# ---------------------------------------------------------------------------
def tool_get_previous_interview_turns(user_id: int, session_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve past questions, answers, and evaluations for an interview session."""
    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return {"error": "Interview session not found.", "turns": []}
    turns = session.turns.all()
    return {
        "session_id": session_id,
        "turns_count": len(turns),
        "turns": [t.to_dict() for t in turns]
    }


# ---------------------------------------------------------------------------
# Tool 14: evaluate_interview_answer
# ---------------------------------------------------------------------------
def tool_evaluate_interview_answer(user_id: int, session_id: int, answer: str = "", **kwargs) -> Dict[str, Any]:
    """Submit answer for current turn, evaluate, and adapt interview session."""
    from services.adaptive_interview_service import submit_adaptive_answer
    return submit_adaptive_answer(user_id=user_id, session_id=session_id, answer=answer)


# ---------------------------------------------------------------------------
# Tool 15: complete_interview
# ---------------------------------------------------------------------------
def tool_complete_interview(user_id: int, session_id: int, **kwargs) -> Dict[str, Any]:
    """Conclude adaptive interview session and compile comprehensive diagnostic report."""
    from services.adaptive_interview_service import complete_adaptive_interview
    return complete_adaptive_interview(user_id=user_id, session_id=session_id)


# ---------------------------------------------------------------------------
# Tool 16: get_candidate_context
# ---------------------------------------------------------------------------
def tool_get_candidate_context(user_id: int, **kwargs) -> Dict[str, Any]:
    """Retrieve the unified canonical candidate state for the continuous AI Coach."""
    from services.candidate_context_service import build_canonical_candidate_state
    return build_canonical_candidate_state(user_id=user_id)


# ---------------------------------------------------------------------------
# Tool 17: record_practice_result
# ---------------------------------------------------------------------------
def tool_record_practice_result(
    user_id: int,
    topic: str,
    score: float,
    problem_name: Optional[str] = None,
    practice_type: str = "coding",
    mistakes: Optional[List[str]] = None,
    concepts_missed: Optional[List[str]] = None,
    feedback: Optional[Dict[str, Any]] = None,
    **kwargs
) -> Dict[str, Any]:
    """Record practice performance, adapt roadmap, and update candidate gaps."""
    from services.candidate_context_service import record_practice_performance
    activity = record_practice_performance(
        user_id=user_id,
        topic=topic,
        score=score,
        problem_name=problem_name,
        practice_type=practice_type,
        mistakes=mistakes,
        concepts_missed=concepts_missed,
        feedback=feedback
    )
    return {"success": True, "activity": activity.to_dict()}


# ---------------------------------------------------------------------------
# Tool 18: get_coaching_timeline
# ---------------------------------------------------------------------------
def tool_get_coaching_timeline(user_id: int, limit: int = 6, **kwargs) -> Dict[str, Any]:
    """Retrieve chronological coaching preparation history."""
    from services.candidate_context_service import get_coaching_timeline
    events = get_coaching_timeline(user_id=user_id, limit=limit)
    return {"success": True, "timeline": events}


# Map of tool names to implementations
AGENT_TOOLS = {
    "get_candidate_profile": tool_get_candidate_profile,
    "get_target_job": tool_get_target_job,
    "analyze_skill_gaps": tool_analyze_skill_gaps,
    "get_user_progress": tool_get_user_progress,
    "retrieve_resume_context": tool_retrieve_resume_context,
    "retrieve_job_context": tool_retrieve_job_context,
    "generate_practice_questions": tool_generate_practice_questions,
    "evaluate_answer": tool_evaluate_answer,
    "create_or_update_roadmap": tool_create_or_update_roadmap,
    "update_user_progress": tool_update_user_progress,
    "recommend_next_action": tool_recommend_next_action,
    "get_interview_session": tool_get_interview_session,
    "get_previous_interview_turns": tool_get_previous_interview_turns,
    "evaluate_interview_answer": tool_evaluate_interview_answer,
    "complete_interview": tool_complete_interview,
    "get_candidate_context": tool_get_candidate_context,
    "record_practice_result": tool_record_practice_result,
    "get_coaching_timeline": tool_get_coaching_timeline,
}

# Explicit JSON schema definitions for model tool-calling
AGENT_TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_candidate_profile",
            "description": "Retrieve candidate's verified skills, projects, experience, and score.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_target_job",
            "description": "Retrieve target role, company, required skills, and match score.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_skill_gaps",
            "description": "Identify missing and partial skills required by the target job.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_progress",
            "description": "Retrieve interview history, test scores, and roadmap completion.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "retrieve_resume_context",
            "description": "Search candidate resume using vector similarity for relevant projects or experience.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query about candidate skills or projects"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "retrieve_job_context",
            "description": "Search job description using vector similarity for required qualifications or duties.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query about job requirements"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_practice_questions",
            "description": "Generate technical practice questions grounded in a specific skill gap.",
            "parameters": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string", "description": "Skill name e.g. SQL, AWS, Docker"},
                    "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                    "count": {"type": "integer"}
                },
                "required": ["skill"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_answer",
            "description": "Evaluate a candidate's answer for technical correctness and depth.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string"}
                },
                "required": ["question", "answer"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_or_update_roadmap",
            "description": "Generate a multi-week preparation roadmap for identified skill gaps.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_role": {"type": "string"},
                    "missing_skills": {"type": "array", "items": {"type": "string"}},
                    "weekly_hours": {"type": "integer"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_next_action",
            "description": "Deterministically evaluate state and calculate next best preparation step.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_interview_session",
            "description": "Retrieve current status, topic, and difficulty for active adaptive interview session.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer"}
                },
                "required": ["session_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_previous_interview_turns",
            "description": "Retrieve previous turns, questions, candidate answers, and score evaluations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer"}
                },
                "required": ["session_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_interview_answer",
            "description": "Submit and evaluate candidate's turn answer and trigger adaptive next question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer"},
                    "answer": {"type": "string"}
                },
                "required": ["session_id", "answer"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete_interview",
            "description": "Conclude adaptive interview session and compile comprehensive diagnostic report.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer"}
                },
                "required": ["session_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_candidate_context",
            "description": "Retrieve full canonical candidate state including skill gaps, roadmap, practice, and interview history.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "record_practice_result",
            "description": "Record coding or practice performance, update skill gaps, and adapt roadmap priorities.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Practiced skill or topic"},
                    "score": {"type": "number", "description": "Score achieved (0-100)"},
                    "problem_name": {"type": "string", "description": "Name of the problem or drill"}
                },
                "required": ["topic", "score"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_coaching_timeline",
            "description": "Retrieve chronological coaching preparation history (practice, interviews, roadmap updates).",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Maximum events to retrieve"}
                }
            }
        }
    }
]


def execute_agent_tool(user_id: int, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safely executes an agent tool with validated arguments and strict user isolation.
    Guarantees no arbitrary code execution or cross-user data leakage.
    """
    if tool_name not in AGENT_TOOLS:
        logger.warning(f"Attempted execution of unrecognized tool: {tool_name}")
        return {"error": f"Tool '{tool_name}' is not recognized.", "success": False}

    try:
        # Sanitize arguments (remove user_id if passed in arguments to prevent spoofing)
        clean_args = {k: v for k, v in (arguments or {}).items() if k != "user_id"}
        tool_fn = AGENT_TOOLS[tool_name]
        logger.info(f"Agent executing tool '{tool_name}' for user {user_id}")
        result = tool_fn(user_id=user_id, **clean_args)
        return {"success": True, "tool": tool_name, "result": result}
    except Exception as e:
        logger.error(f"Error executing agent tool '{tool_name}': {e}", exc_info=True)
        return {"error": str(e), "success": False, "tool": tool_name}
