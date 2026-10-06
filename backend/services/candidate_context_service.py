"""
Candidate Context Service for InterviewPilot Continuous AI Coach.
Provides the single canonical candidate state, priority calculation engine,
practice performance recording, dynamic roadmap adaptation, progress signals,
and chronological coaching timeline.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from database.db import db
from models.user import User
from models.candidate import CandidateProfile, JobTarget
from models.roadmap import Roadmap
from models.interview import Interview, InterviewSession, InterviewTurn
from models.practice import PracticeActivity
from models.dsa import DSAProgress
from services.rag_service import index_practice_feedback_document
from services.retrieval_service import search_coaching_context, search_interview_feedback, search_practice_feedback

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Canonical Candidate State (Single Source of Truth)
# ---------------------------------------------------------------------------
def build_canonical_candidate_state(user_id: int) -> Dict[str, Any]:
    """
    Constructs the canonical, unified representation of candidate state.
    Used by the AI Coach, Next Best Action engine, and dashboard.
    """
    user = db.session.get(User, user_id)
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()
    roadmap = Roadmap.query.filter_by(user_id=user_id).order_by(Roadmap.created_at.desc()).first()

    # Practice records
    practices = PracticeActivity.query.filter_by(user_id=user_id).order_by(PracticeActivity.created_at.desc()).all()
    dsa_records = DSAProgress.query.filter_by(user_id=user_id).all()

    # Interview records (both adaptive sessions and legacy interviews)
    adaptive_sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.created_at.desc()).all()
    legacy_interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()

    # 1. Candidate slice
    has_profile = bool(profile and profile.skills and len(profile.skills) > 0)
    resume_available = bool(profile and profile.resume_score is not None and profile.resume_score > 0)
    skills = profile.skills or [] if profile else []
    projects = [p.get("name") if isinstance(p, dict) else str(p) for p in (profile.projects or [])] if profile else []
    experience = [e.get("role") if isinstance(e, dict) else str(e) for e in (profile.experience or [])] if profile else []

    # 2. Target slice
    target_role = target.target_role if target else (user.target_role if user else None)
    target_company = target.target_company if target else (user.target_company if user else None)
    required_skills = target.required_skills or [] if target else []
    preferred_skills = target.preferred_skills or [] if target else []
    match_score = target.match_score if target else None

    # 3. Skill Gaps slice
    strong_skills = list(target.strong_matches or []) if target else []
    partial_skills = list(target.partial_matches or []) if target else []
    missing_skills = list(target.missing_skills or []) if target else []

    if not strong_skills and profile and profile.skills:
        strong_skills = [s for s in profile.skills if any(s.lower() == req.lower() for req in required_skills)]
    if not missing_skills and required_skills:
        missing_skills = [r for r in required_skills if not any(r.lower() == s.lower() for s in skills)]

    # 4. Roadmap slice
    roadmap_exists = bool(roadmap)
    completed_items = []
    pending_items = []
    current_priority = None

    if roadmap and roadmap.roadmap_data:
        weeks = roadmap.roadmap_data.get("weeks", []) if isinstance(roadmap.roadmap_data, dict) else []
        for w in weeks:
            title = w.get("theme") or w.get("focus") or f"Week {w.get('week')}"
            if w.get("completed") or w.get("status") == "completed":
                completed_items.append(title)
            else:
                pending_items.append(title)
                if not current_priority:
                    current_priority = title

    if not current_priority and missing_skills:
        current_priority = missing_skills[0]

    # 5. Practice slice
    practice_topics = [p.topic for p in practices]
    practice_scores = [round(float(p.score), 1) for p in practices if p.score is not None]
    practice_weak = []
    practice_strong = []

    # Topic performance map from practice
    practice_topic_scores = {}
    for p in practices:
        if p.topic not in practice_topic_scores:
            practice_topic_scores[p.topic] = []
        practice_topic_scores[p.topic].append(p.score)

    for top, scores in practice_topic_scores.items():
        latest_score = scores[0]
        avg_s = (latest_score * 0.7) + ((sum(scores) / len(scores)) * 0.3)
        if latest_score >= 75 or avg_s >= 75:
            practice_strong.append(top)
        elif latest_score < 60 and avg_s < 65:
            practice_weak.append(top)

    # 6. Interviews slice
    completed_interviews = len([s for s in adaptive_sessions if s.status == "completed"]) + len(legacy_interviews)
    interview_scores = []
    for s in adaptive_sessions:
        if s.overall_score is not None and s.overall_score > 0:
            interview_scores.append(round(float(s.overall_score), 1))
    for li in legacy_interviews:
        if li.overall_score is not None and li.overall_score > 0:
            interview_scores.append(round(float(li.overall_score), 1))

    interview_weak = []
    interview_strong = []
    for s in adaptive_sessions:
        if s.weak_topics and isinstance(s.weak_topics, list):
            for wt in s.weak_topics:
                if wt not in interview_weak:
                    interview_weak.append(wt)
        if s.strong_topics and isinstance(s.strong_topics, list):
            for st in s.strong_topics:
                if st not in interview_strong:
                    interview_strong.append(st)

    for li in legacy_interviews:
        if li.feedback and isinstance(li.feedback, dict):
            w = li.feedback.get("weaknesses") or []
            if isinstance(w, list):
                for item in w:
                    if item not in interview_weak:
                        interview_weak.append(item)

    # 7. Agent Priority Calculation
    focus_topic, priority_reason, action_type, target_route = compute_agent_priority(
        profile=profile,
        target=target,
        missing_skills=missing_skills,
        required_skills=required_skills,
        interview_weak=interview_weak,
        practice_weak=practice_weak,
        practice_strong=practice_strong,
        strong_skills=strong_skills,
        completed_interviews=completed_interviews,
        roadmap_exists=roadmap_exists
    )

    return {
        "candidate": {
            "profile_complete": has_profile,
            "resume_available": resume_available,
            "skills": skills,
            "projects": projects,
            "experience": experience,
            "resume_score": profile.resume_score if profile else 0
        },
        "target": {
            "role": target_role,
            "company": target_company,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "match_score": match_score
        },
        "skill_gaps": {
            "strong": strong_skills,
            "needs_improvement": partial_skills,
            "missing": missing_skills
        },
        "roadmap": {
            "exists": roadmap_exists,
            "current_priority": current_priority,
            "completed_items": completed_items,
            "pending_items": pending_items,
            "completion_pct": roadmap.completion_pct if roadmap else 0.0
        },
        "practice": {
            "recent_topics": practice_topics[:5],
            "recent_scores": practice_scores[:5],
            "weak_topics": practice_weak,
            "strong_topics": practice_strong,
            "total_activities": len(practices) + len(dsa_records)
        },
        "interviews": {
            "completed": completed_interviews,
            "recent_scores": interview_scores[:5],
            "weak_topics": interview_weak[:5],
            "strong_topics": interview_strong[:5]
        },
        "agent": {
            "current_focus": focus_topic,
            "priority": focus_topic,
            "priority_reason": priority_reason,
            "recommended_action": action_type,
            "target": target_route
        }
    }


# ---------------------------------------------------------------------------
# 2. Priority Engine (Highest-Value Gap Identification)
# ---------------------------------------------------------------------------
def compute_agent_priority(
    profile: Optional[CandidateProfile],
    target: Optional[JobTarget],
    missing_skills: List[str],
    required_skills: List[str],
    interview_weak: List[str],
    practice_weak: List[str],
    practice_strong: List[str],
    strong_skills: List[str],
    completed_interviews: int,
    roadmap_exists: bool
) -> tuple:
    """
    Ranks weaknesses to find the single highest-value focus area.
    Formula balances JD requirement weight, verified interview weakness,
    practice test results, and filters out already mastered skills.
    """
    # Baseline checks
    if not profile or not profile.skills:
        return ("Resume Upload", "Resume analysis required to benchmark your skills.", "START_RESUME", "/resume")

    if not target or not target.target_role:
        return ("Target Role Selection", "Select your target role to identify required skills.", "SELECT_TARGET_ROLE", "/roles")

    if not roadmap_exists:
        return ("Build Preparation Plan", "Generate your personalized roadmap to structure your prep.", "BUILD_ROADMAP", "/roadmap")

    # Evaluate candidate topics across signals
    candidates = {}

    # Weight 1: Missing skills from Job Target
    for s in missing_skills:
        candidates[s] = candidates.get(s, 0.0) + 3.0

    # Weight 2: Weak interview topics (highest practical urgency)
    for iw in interview_weak:
        candidates[iw] = candidates.get(iw, 0.0) + 4.0

    # Weight 3: Practice weaknesses
    for pw in practice_weak:
        candidates[pw] = candidates.get(pw, 0.0) + 3.5

    # Negative Weight: Strong verified skills & practice successes
    for st in strong_skills:
        if st in candidates:
            candidates[st] -= 3.0
    for ps in practice_strong:
        if ps in candidates:
            candidates[ps] -= 4.0

    # Filter out topics with score <= 0 if other candidates exist
    viable = {k: v for k, v in candidates.items() if v > 0}
    if not viable and candidates:
        viable = candidates

    if viable:
        top_topic = max(viable.items(), key=lambda x: x[1])[0]
        # Determine why it is recommended
        reasons = []
        if any(top_topic.lower() == req.lower() for req in required_skills):
            reasons.append(f"Required for {target.target_role}")
        if any(top_topic.lower() == iw.lower() for iw in interview_weak):
            reasons.append("Identified as weak during recent mock interview")
        elif any(top_topic.lower() == pw.lower() for pw in practice_weak):
            reasons.append("Recent practice drill showed conceptual gaps")
        elif top_topic in missing_skills:
            reasons.append("Missing from resume and high-yield for target role")

        reason_str = " + ".join(reasons) if reasons else f"High priority focus area for {target.target_role}"

        # Decide action type
        if any(top_topic.lower() == iw.lower() for iw in interview_weak):
            action_type = "IMPROVE_WEAK_TOPIC"
            target_route = "/interview"
        else:
            action_type = "PRACTICE_SKILL"
            target_route = "/code"

        return (top_topic, reason_str, action_type, target_route)

    # If all verified skills are strong and no weak topics exist
    if completed_interviews == 0:
        return (target.target_role, "Validate your strong foundation in a realistic mock interview.", "TAKE_MOCK_INTERVIEW", "/interview")

    return (target.target_role, "Your core skills are solid. Focus on full-length mock interviews.", "COMPLETE_PREPARATION", "/interview")


# ---------------------------------------------------------------------------
# 3. Practice Performance Recording & Progress Feedback Loop
# ---------------------------------------------------------------------------
def record_practice_performance(
    user_id: int,
    topic: str,
    score: float,
    problem_name: Optional[str] = None,
    practice_type: str = "coding",
    mistakes: Optional[List[str]] = None,
    concepts_missed: Optional[List[str]] = None,
    feedback: Optional[Dict[str, Any]] = None
) -> PracticeActivity:
    """
    Records a completed practice session and executes the closed loop:
    1. Persists PracticeActivity in PostgreSQL.
    2. Updates JobTarget skill gaps (promotes on high score, flags on low score).
    3. Updates Roadmap task priority dynamically.
    4. Indexes practice feedback into pgvector document store.
    5. Syncs to DSAProgress for problem solving counters.
    """
    clean_topic = topic.strip()
    score_val = max(0.0, min(100.0, float(score)))

    activity = PracticeActivity(
        user_id=user_id,
        topic=clean_topic,
        problem_name=problem_name or f"{clean_topic} Drill",
        practice_type=practice_type,
        score=score_val,
        questions_attempted=1,
        mistakes=mistakes or [],
        concepts_missed=concepts_missed or [],
        feedback=feedback or {}
    )
    db.session.add(activity)
    db.session.flush()

    # 1. Update JobTarget Skill Gaps dynamically based on performance
    target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()
    if target:
        missing = list(target.missing_skills or [])
        strong = list(target.strong_matches or [])
        partial = list(target.partial_matches or [])

        # Match topic case-insensitively
        matched_missing = [m for m in missing if m.lower() == clean_topic.lower()]

        if score_val >= 75:
            # Good performance: reduce gap priority
            if matched_missing:
                for mm in matched_missing:
                    missing.remove(mm)
                if clean_topic not in strong:
                    strong.append(clean_topic)
                target.missing_skills = missing
                target.strong_matches = strong
                logger.info("Promoted '%s' from missing to strong for user %s after practice score %.1f", clean_topic, user_id, score_val)
            elif clean_topic not in strong and clean_topic in partial:
                partial.remove(clean_topic)
                strong.append(clean_topic)
                target.partial_matches = partial
                target.strong_matches = strong
        elif score_val < 60:
            # Poor performance: ensure topic is marked as a priority gap
            if not matched_missing and clean_topic not in missing:
                missing.insert(0, clean_topic)
                target.missing_skills = missing
                if clean_topic in strong:
                    strong.remove(clean_topic)
                target.strong_matches = strong
                logger.info("Added '%s' to missing skills for user %s after low practice score %.1f", clean_topic, user_id, score_val)

        db.session.add(target)

    # 2. Dynamic Roadmap Adaptation
    update_roadmap_priorities(user_id=user_id, topic=clean_topic, score=score_val)

    # 3. Sync to DSAProgress if applicable
    if practice_type in ["coding", "algorithm"]:
        dsa_entry = DSAProgress.query.filter_by(
            user_id=user_id,
            problem_name=problem_name or f"{clean_topic} Challenge"
        ).first()
        if not dsa_entry:
            dsa_entry = DSAProgress(
                user_id=user_id,
                topic=clean_topic,
                problem_name=problem_name or f"{clean_topic} Challenge",
                difficulty="medium",
                solved=bool(score_val >= 70),
                notes=feedback.get("review_summary") if feedback else None
            )
            db.session.add(dsa_entry)
        else:
            dsa_entry.solved = bool(score_val >= 70)

    # 4. Commit all database updates
    db.session.commit()

    # 5. Index into pgvector document store
    try:
        index_practice_feedback_document(
            user_id=user_id,
            practice_id=activity.id,
            topic=clean_topic,
            problem_name=problem_name,
            score=score_val,
            feedback=feedback,
            mistakes=mistakes,
            concepts_missed=concepts_missed
        )
    except Exception as e:
        logger.warning("RAG indexing of practice feedback skipped: %s", e)

    return activity


# ---------------------------------------------------------------------------
# 4. Dynamic Roadmap Adaptation
# ---------------------------------------------------------------------------
def update_roadmap_priorities(user_id: int, topic: str, score: float):
    """
    Adjusts the candidate's existing roadmap according to verified performance.
    - If score >= 75: decreases priority, marks topic mastered/completed.
    - If score < 60: increases priority to 'high', marks topic for review.
    Does NOT rewrite the entire roadmap; modifies priorities and preserves completed work.
    """
    roadmap = Roadmap.query.filter_by(user_id=user_id).order_by(Roadmap.created_at.desc()).first()
    if not roadmap or not roadmap.roadmap_data:
        return

    data = dict(roadmap.roadmap_data)
    weeks = data.get("weeks", []) if isinstance(data, dict) else []
    modified = False

    for w in weeks:
        theme = str(w.get("theme", "")).lower()
        skills = [str(s).lower() for s in (w.get("skills") or [])]
        topics = [str(t).lower() for t in (w.get("topics") or [])]
        topic_lower = topic.lower()

        # Check if this roadmap milestone matches the practiced topic
        if (topic_lower in theme) or any(topic_lower in s for s in skills) or any(topic_lower in t for t in topics):
            if score >= 75:
                w["priority"] = "low"
                w["status"] = "completed"
                w["completed"] = True
                w["mastery_score"] = round(score, 1)
                modified = True
                logger.info("Roadmap week %s ('%s') marked completed/low priority after score %.1f", w.get("week"), topic, score)
            elif score < 60:
                w["priority"] = "high"
                w["needs_review"] = True
                w["status"] = "in_progress"
                w["completed"] = False
                modified = True
                logger.info("Roadmap week %s ('%s') elevated to high priority after score %.1f", w.get("week"), topic, score)

    if modified:
        # Recalculate completion percentage
        completed_count = len([w for w in weeks if w.get("completed") or w.get("status") == "completed"])
        roadmap.completion_pct = round((completed_count / len(weeks)) * 100, 1) if weeks else 0.0
        data["weeks"] = weeks
        roadmap.roadmap_data = dict(data)
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(roadmap, "roadmap_data")
        roadmap.updated_at = datetime.now(timezone.utc)
        db.session.add(roadmap)
        db.session.commit()


# ---------------------------------------------------------------------------
# 5. Meaningful Progress Signals
# ---------------------------------------------------------------------------
def calculate_progress_signals(user_id: int, state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extracts authentic, non-fabricated preparation progress indicators.
    Returns None / 'Not enough data yet' when insufficient data exists.
    """
    if not state:
        state = build_canonical_candidate_state(user_id)

    candidate = state.get("candidate", {})
    target = state.get("target", {})
    interviews = state.get("interviews", {})
    practice = state.get("practice", {})

    resume_score = candidate.get("resume_score")
    role_match = target.get("match_score")
    interview_scores = interviews.get("recent_scores", [])
    practice_scores = practice.get("recent_scores", [])

    has_interview_data = len(interview_scores) > 0
    has_practice_data = len(practice_scores) > 0
    has_resume_data = bool(resume_score and resume_score > 0)

    # Readiness score calculation
    readiness_components = []
    if has_resume_data:
        readiness_components.append(resume_score)
    if role_match is not None:
        readiness_components.append(role_match)
    if has_interview_data:
        readiness_components.append(sum(interview_scores) / len(interview_scores))
    if has_practice_data:
        readiness_components.append(sum(practice_scores) / len(practice_scores))

    if readiness_components:
        overall_readiness = round(sum(readiness_components) / len(readiness_components), 1)
        readiness_label = "Interview Ready" if overall_readiness >= 75 else ("Progressing Well" if overall_readiness >= 55 else "Needs Practice")
    else:
        overall_readiness = None
        readiness_label = "Not enough data yet"

    # Skills improving: topics where score improved or transitioned from weak to strong
    strong_topics = list(set(practice.get("strong_topics", []) + interviews.get("strong_topics", [])))
    weak_remaining = list(set(practice.get("weak_topics", []) + interviews.get("weak_topics", []) + state.get("skill_gaps", {}).get("missing", [])))
    for st in strong_topics:
        if st in weak_remaining:
            weak_remaining.remove(st)

    # Practice consistency
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_practices_count = PracticeActivity.query.filter(
        PracticeActivity.user_id == user_id,
        PracticeActivity.created_at >= one_week_ago
    ).count()
    recent_interviews_count = InterviewSession.query.filter(
        InterviewSession.user_id == user_id,
        InterviewSession.created_at >= one_week_ago
    ).count()
    sessions_this_week = recent_practices_count + recent_interviews_count

    return {
        "interview_readiness": overall_readiness,
        "readiness_label": readiness_label,
        "role_alignment": round(float(role_match), 1) if role_match is not None else None,
        "role_alignment_label": f"{round(float(role_match))}% Match" if role_match is not None else "Not enough data yet",
        "skills_improving": strong_topics[:4],
        "weak_areas_remaining": weak_remaining[:4],
        "practice_consistency": {
            "sessions_this_week": sessions_this_week,
            "status": "Consistent" if sessions_this_week >= 3 else ("Active" if sessions_this_week >= 1 else "Getting Started")
        },
        "has_sufficient_data": bool(overall_readiness is not None)
    }


# ---------------------------------------------------------------------------
# 6. Chronological Coaching Timeline
# ---------------------------------------------------------------------------
def get_coaching_timeline(user_id: int, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Gathers a lightweight, verified chronological preparation history.
    Extracts real events: practice sessions, mock interviews, roadmap milestones.
    """
    events = []

    # 1. Practice activities
    practices = PracticeActivity.query.filter_by(user_id=user_id).order_by(PracticeActivity.created_at.desc()).limit(limit).all()
    for p in practices:
        events.append({
            "id": f"prac-{p.id}",
            "type": "practice",
            "title": f"Completed {p.topic} practice",
            "detail": f"Scored {round(p.score)}% on {p.problem_name or 'drill'}",
            "status": "success" if p.score >= 70 else "warning",
            "timestamp": p.created_at,
            "badge": f"{round(p.score)}% Score",
            "route": "/code"
        })

    # 2. Adaptive interview sessions
    sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.created_at.desc()).limit(limit).all()
    for s in sessions:
        if s.status == "completed":
            events.append({
                "id": f"iv-sess-{s.id}",
                "type": "interview",
                "title": f"Completed {s.target_role or 'Mock'} Interview",
                "detail": f"Covered {', '.join(s.covered_topics[:2]) if s.covered_topics else 'core topics'}",
                "status": "success" if (s.overall_score or 0) >= 65 else "warning",
                "timestamp": s.created_at,
                "badge": f"{round(s.overall_score or 0)}% Score",
                "route": "/interview"
            })

    # 3. Resume analysis
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    if profile and profile.updated_at:
        events.append({
            "id": f"prof-{profile.id}",
            "type": "resume",
            "title": "Resume parsed & CandidateProfile verified",
            "detail": f"{len(profile.skills or [])} verified skills indexed into RAG memory",
            "status": "info",
            "timestamp": profile.updated_at,
            "badge": f"{round(profile.resume_score or 0)}% ATS",
            "route": "/resume"
        })

    # Sort reverse chronologically
    events.sort(key=lambda x: x["timestamp"] if x["timestamp"] else datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    # Format relative time strings
    now = datetime.now(timezone.utc)
    formatted = []
    for ev in events[:limit]:
        ts = ev["timestamp"]
        if not ts:
            rel = "Recently"
        else:
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            delta = now - ts
            if delta.total_seconds() < 3600:
                rel = "Just now" if delta.total_seconds() < 120 else f"{int(delta.total_seconds() // 60)}m ago"
            elif delta.total_seconds() < 86400:
                rel = f"{int(delta.total_seconds() // 3600)}h ago"
            elif delta.total_seconds() < 172800:
                rel = "Yesterday"
            elif delta.days < 7:
                rel = f"{delta.days}d ago"
            else:
                rel = ts.strftime("%b %d")

        ev_copy = dict(ev)
        ev_copy["relative_time"] = rel
        ev_copy["timestamp"] = ts.isoformat() if ts else None
        formatted.append(ev_copy)

    return formatted
