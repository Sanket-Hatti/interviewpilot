"""
InterviewPilot Agent Service.
Orchestrates autonomous decision making, tool calling with schema validation,
grounded RAG context retrieval, and deterministic rule-based fallback.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq
from database.db import db
from models.user import User
from models.candidate import CandidateProfile, JobTarget
from models.roadmap import Roadmap
from models.interview import Interview
from models.dsa import DSAProgress
from services.agent_tools import (
    AGENT_TOOLS_SCHEMA,
    execute_agent_tool,
    tool_recommend_next_action,
    tool_get_candidate_profile,
    tool_get_target_job,
    tool_analyze_skill_gaps,
    tool_get_user_progress,
)
from services.retrieval_service import (
    construct_rag_context,
    search_resume_context,
    search_job_context,
)

logger = logging.getLogger(__name__)

API_KEY = os.getenv("GROQ_API_KEY", "")
AGENT_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
groq_client = Groq(api_key=API_KEY, timeout=12.0) if API_KEY else None


# ---------------------------------------------------------------------------
# Part 8: Agent State Representation
# ---------------------------------------------------------------------------
def get_agent_state(user_id: int) -> Dict[str, Any]:
    """
    Constructs the canonical representation of candidate state.
    Provides complete situational awareness for the decision agent.
    """
    from services.candidate_context_service import build_canonical_candidate_state, calculate_progress_signals
    canonical = build_canonical_candidate_state(user_id)
    signals = calculate_progress_signals(user_id, canonical)

    cand = canonical["candidate"]
    tgt = canonical["target"]
    gaps = canonical["skill_gaps"]
    rd = canonical["roadmap"]
    prac = canonical["practice"]
    iv = canonical["interviews"]
    ag = canonical["agent"]

    result = dict(canonical)
    result.update({
        "user_id": user_id,
        "target_role": tgt["role"],
        "target_company": tgt["company"],
        "resume_available": cand["resume_available"],
        "resume_score": cand["resume_score"],
        "verified_skills": cand["skills"][:10],
        "skill_gaps": gaps["missing"][:5] or gaps["needs_improvement"][:5],
        "roadmap_status": "active" if rd["exists"] else "pending",
        "roadmap_completion_pct": rd["completion_pct"],
        "recent_interview_scores": iv["recent_scores"][:4],
        "recent_practice_scores": prac["recent_scores"][:4],
        "dsa_problems_solved": prac.get("total_activities", 0),
        "recent_weaknesses": iv["weak_topics"][:4] + prac["weak_topics"][:4],
        "current_focus": ag["current_focus"],
        "progress_signals": signals
    })
    return result


# ---------------------------------------------------------------------------
# Part 7: Rule-based next action (Deterministic guaranteed foundation)
# ---------------------------------------------------------------------------
def rule_based_next_action(user_id: int) -> Dict[str, Any]:
    """Guaranteed deterministic next best action. Never fails."""
    action = tool_recommend_next_action(user_id=user_id)
    action["source"] = "rule_based"
    return action


# ---------------------------------------------------------------------------
# Part 5 & 9: Agent Decision Loop with LLM Tool Calling
# ---------------------------------------------------------------------------
def agent_next_action(user_id: int) -> Dict[str, Any]:
    """
    Autonomous decision loop for InterviewPilot AI Coach:
    1. Observes canonical candidate state.
    2. Retrieves relevant coaching RAG memory (interview feedback, practice mistakes).
    3. Uses LLM tool calling to deliberate and select appropriate backend action.
    4. Executes chosen tool or formulates targeted next action.
    5. Falls back seamlessly to rule_based_next_action on any API failure.
    """
    logger.info("Agent started deliberation for user %s", user_id)
    state = get_agent_state(user_id)

    # Fast short-circuit if resume is not uploaded yet
    if not state.get("resume_available"):
        logger.info("Agent noticed missing resume for user %s -> rule-based recommendation", user_id)
        return rule_based_next_action(user_id)

    if not groq_client:
        logger.info("Groq client unavailable -> triggering rule_based fallback for user %s", user_id)
        return rule_based_next_action(user_id)

    # Retrieve relevant coaching memory from pgvector
    focus_topic = state.get("current_focus") or state.get("target_role") or "Software Engineering"
    try:
        from services.retrieval_service import search_coaching_context
        coaching_chunks = search_coaching_context(user_id=user_id, query=f"{focus_topic} weaknesses mistakes requirements", top_k=3)
        coaching_mem = "\n".join(f"[{c['document_type']} - {c['section']}]: {c['content'][:150]}..." for c in coaching_chunks) if coaching_chunks else "No prior drill or interview feedback chunks indexed yet."
    except Exception as e:
        logger.warning("Coaching memory retrieval skipped: %s", e)
        coaching_mem = "Memory retrieval unavailable."

    system_prompt = (
        "You are the InterviewPilot Decision Agent (AI Coach). You guide a candidate to prepare for their target job.\n"
        "Observe the candidate's canonical state and historical coaching memory.\n"
        "Select the single most appropriate tool to run, or recommend the next best action.\n"
        "Possible next actions: START_RESUME, SELECT_TARGET_ROLE, ANALYZE_ROLE, BUILD_ROADMAP, PRACTICE_SKILL, CONTINUE_SKILL, TAKE_MOCK_INTERVIEW, REVIEW_INTERVIEW, IMPROVE_WEAK_TOPIC, REVISE_RESUME, COMPLETE_PREPARATION.\n"
        "Prioritize resolving high-impact skill gaps identified in interviews or practice over already mastered skills.\n"
        "Do NOT invent skills, roles, or scores not present in the user state."
    )

    user_prompt = (
        f"Candidate State:\n{json.dumps(state, indent=2)}\n\n"
        f"Historical Coaching Memory:\n{coaching_mem}\n\n"
        "Analyze the candidate's state. Which tool should be called to determine or advance the next preparation step?"
    )

    try:
        response = groq_client.chat.completions.create(
            model=AGENT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            tools=AGENT_TOOLS_SCHEMA,
            tool_choice="auto",
            temperature=0.2,
            max_tokens=512
        )

        choice = response.choices[0]
        message = choice.message

        # Check if the model selected a tool
        if message.tool_calls and len(message.tool_calls) > 0:
            tool_call = message.tool_calls[0]
            tool_name = tool_call.function.name
            raw_args = tool_call.function.arguments or "{}"

            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except Exception:
                args = {}

            logger.info("Agent selected tool: '%s' with args %s for user %s", tool_name, args, user_id)
            tool_output = execute_agent_tool(user_id=user_id, tool_name=tool_name, arguments=args)
            logger.info("Agent tool executed successfully: %s", tool_name)

            # If tool was recommend_next_action, enrich and return
            if tool_name == "recommend_next_action" and tool_output.get("success"):
                res = tool_output.get("result", {})
                res["source"] = "agent"
                res["tool_executed"] = tool_name
                logger.info("Agent completed deliberation with tool '%s' for user %s", tool_name, user_id)
                return res

            # If tool was generate_practice_questions, format targeted action
            if tool_name == "generate_practice_questions" and tool_output.get("success"):
                skill = args.get("skill", state.get("current_focus") or "Core Technical")
                return {
                    "title": f"Practice {skill} Technical Questions",
                    "description": f"Targeted practice questions generated for {skill} based on your identified gap for {state.get('target_role')}.",
                    "action_label": f"Start {skill} practice →",
                    "route": "/code",
                    "target": "/code",
                    "action": "PRACTICE_SKILL",
                    "topic": skill,
                    "priority": skill,
                    "reason": f"gap_drill_{skill.lower()}",
                    "why_reasons": [f"Required by target role: {state.get('target_role')}", f"Isolated skill gap on your roadmap", "Targeted practice questions ready"],
                    "focus_skill": skill,
                    "confidence": 0.88,
                    "source": "agent",
                    "tool_executed": tool_name
                }

            if tool_name == "create_or_update_roadmap" and tool_output.get("success"):
                return {
                    "title": "Review your updated roadmap",
                    "description": f"Personalized curriculum adjusted for your primary gaps ({', '.join(state.get('skill_gaps', [])[:3])}).",
                    "action_label": "View your roadmap →",
                    "route": "/roadmap",
                    "target": "/roadmap",
                    "action": "BUILD_ROADMAP",
                    "topic": state.get("current_focus"),
                    "priority": state.get("current_focus"),
                    "reason": "roadmap_updated",
                    "why_reasons": ["Milestones adjusted to your active progress", "Updated weekly focus based on real performance", "Prepares you systematically for interview rounds"],
                    "focus_skill": state.get("current_focus"),
                    "confidence": 0.90,
                    "source": "agent",
                    "tool_executed": tool_name
                }

            # For other tools, fall back to rule-based synthesis using updated context
            base_action = rule_based_next_action(user_id)
            base_action["source"] = "agent"
            base_action["tool_executed"] = tool_name
            logger.info("Agent completed deliberation for user %s", user_id)
            return base_action

        # If LLM replied with content instead of tool call, parse or fall back
        logger.info("Agent completed with direct message deliberation for user %s", user_id)
        base_action = rule_based_next_action(user_id)
        base_action["source"] = "agent_synthesized"
        return base_action

    except Exception as err:
        logger.warning("Agent deliberation failed (%s); triggering fallback for user %s", err, user_id)
        fallback = rule_based_next_action(user_id)
        fallback["source"] = "fallback"
        fallback["fallback_reason"] = str(err)
        return fallback


# ---------------------------------------------------------------------------
# Part 2 & 3: Grounded Interview Question Generation via RAG
# ---------------------------------------------------------------------------
def generate_grounded_interview_questions(
    user_id: int,
    role: str,
    difficulty: str = "medium",
    topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates interview questions strictly anchored in retrieved resume + job context.
    Prevents LLM hallucination of unmentioned technologies, companies, or projects.
    """
    logger.info("Generating grounded questions for user %s, role %s, topic %s", user_id, role, topic)

    # 1. Retrieve resume context (projects, work experience, tools)
    query_topic = topic or f"{role} technical architecture, projects, and programming skills"
    resume_chunks = search_resume_context(user_id=user_id, query=query_topic, top_k=3)
    job_chunks = search_job_context(user_id=user_id, query=query_topic, top_k=3)

    retrieval_count = len(resume_chunks) + len(job_chunks)
    logger.info("Retrieval performed: %d chunks retrieved (%d resume, %d job)", retrieval_count, len(resume_chunks), len(job_chunks))

    resume_context_str = "\n".join([f"[{c['section']}]: {c['content']}" for c in resume_chunks])
    job_context_str = "\n".join([f"[{c['section']}]: {c['content']}" for c in job_chunks])

    if not resume_context_str:
        resume_context_str = "No specific candidate resume project chunks indexed yet."
    if not job_context_str:
        job_context_str = f"Target Role: {role} requirements and standard hiring benchmarks."

    prompt = f"""You are a technical hiring manager creating an interview for a candidate applying for: {role}.
Difficulty: {difficulty}

CANDIDATE VERIFIED RESUME CONTEXT:
{resume_context_str}

TARGET JOB DESCRIPTION CONTEXT:
{job_context_str}

CRITICAL ANTI-HALLUCINATION RULES:
1. Every technical question about past work or projects MUST refer ONLY to the projects and technologies explicitly mentioned in the Candidate Resume Context above.
2. If a specific project name is mentioned in the context (e.g. InterviewPilot, E-Commerce, etc.), ground questions around its specific architectural choices.
3. Do NOT invent companies, college names, or technologies the candidate has not listed.
4. Align required skills from the Target Job Context with the candidate's actual experience.

Generate 5 Technical, 3 Behavioral, and 2 HR questions.
Return ONLY this JSON object:
{{
  "technical": ["q1", "q2", "q3", "q4", "q5"],
  "behavioral": ["q1", "q2", "q3"],
  "hr": ["q1", "q2"]
}}"""

    try:
        if groq_client:
            response = groq_client.chat.completions.create(
                model=AGENT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024
            )
            raw = response.choices[0].message.content.strip()
            # Strip markdown fences
            raw_clean = raw.replace("```json", "").replace("```", "").strip()
            start_idx = raw_clean.find("{")
            end_idx = raw_clean.rfind("}")
            if start_idx != -1 and end_idx != -1:
                parsed = json.loads(raw_clean[start_idx:end_idx + 1])
                if isinstance(parsed, dict) and "technical" in parsed:
                    return {
                        "success": True,
                        "grounded": True,
                        "chunks_used": retrieval_count,
                        "role": role,
                        "difficulty": difficulty,
                        "questions": parsed,
                        "retrieved_context": {
                            "resume_excerpts": [c["content"][:150] + "..." for c in resume_chunks],
                            "job_excerpts": [c["content"][:150] + "..." for c in job_chunks],
                        }
                    }
    except Exception as e:
        logger.warning("Grounded question generation failed via LLM (%s), using grounded template fallback", e)

    # High quality grounded deterministic template fallback
    from models.candidate import CandidateProfile
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    skills = (profile.skills if profile else []) or ["Python", "Databases", "APIs"]
    primary_skill = skills[0] if skills else "Software Engineering"
    secondary_skill = skills[1] if len(skills) > 1 else "System Design"

    fallback_questions = {
        "technical": [
            f"Based on your work with {primary_skill}, how did you handle data integrity, error logging, and edge cases?",
            f"In your recent projects, what trade-offs did you evaluate when architecting {secondary_skill} components?",
            f"How do you profile and optimize memory or CPU bottlenecks in {primary_skill} applications?",
            f"Describe how you structure unit, integration, and end-to-end automated tests for a {role} codebase.",
            "Explain how you design fault-tolerant APIs to handle network partitions and downstream service timeouts."
        ],
        "behavioral": [
            "Describe a complex technical disagreement you had regarding architecture. How did you validate your approach?",
            "Tell me about a production issue or bug that reached staging/production. What was your root cause analysis?",
            "How do you balance writing clean, maintainable code with aggressive delivery deadlines?"
        ],
        "hr": [
            f"What attracts you specifically to this {role} opportunity and our engineering culture?",
            "What technical challenge are you most eager to tackle in your next position?"
        ]
    }

    return {
        "success": True,
        "grounded": bool(retrieval_count > 0),
        "chunks_used": retrieval_count,
        "role": role,
        "difficulty": difficulty,
        "questions": fallback_questions,
        "retrieved_context": {
            "resume_excerpts": [c["content"][:150] + "..." for c in resume_chunks],
            "job_excerpts": [c["content"][:150] + "..." for c in job_chunks],
        }
    }
