from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.role import Role
from models.user import User
from models.candidate import CandidateProfile, JobTarget
from services.role_service import match_all_roles, match_role
from services.job_service import analyze_job_description, calculate_skill_gap

roles_bp = Blueprint("roles", __name__, url_prefix="/api/roles")


@roles_bp.route("/", methods=["GET"])
@jwt_required()
def list_roles():
    roles = Role.query.order_by(Role.role_name).all()
    return jsonify({"success": True, "roles": [r.to_dict() for r in roles]}), 200


@roles_bp.route("/match", methods=["POST"])
@jwt_required()
def match():
    data = request.get_json(silent=True) or {}
    user_skills = data.get("skills", [])

    if not user_skills:
        return jsonify({"success": False, "errors": ["skills array is required."]}), 400

    roles = Role.query.all()
    results = match_all_roles(user_skills, roles)

    return jsonify({
        "success": True,
        "user_skills": user_skills,
        "total_roles": len(results),
        "matches": results,
        "best_match": results[0] if results else None,
    }), 200


@roles_bp.route("/match/<int:role_id>", methods=["POST"])
@jwt_required()
def match_specific(role_id):
    data = request.get_json(silent=True) or {}
    user_skills = data.get("skills", [])

    role = db.session.get(Role, role_id)
    if not role:
        return jsonify({"success": False, "errors": ["Role not found."]}), 404

    result = match_role(user_skills, role.required_skills)
    return jsonify({
        "success": True,
        "role_name": role.role_name,
        **result,
    }), 200


@roles_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_role_and_job():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    target_role = (data.get("target_role") or "").strip()
    target_company = (data.get("target_company") or "").strip() or None
    job_description = (data.get("job_description") or "").strip() or None
    use_benchmark = bool(data.get("use_benchmark", False))

    if not target_role:
        user = db.session.get(User, user_id)
        target_role = (user.target_role if user else None) or "Software Engineer"

    # Fetch candidate profile
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    candidate_skills = profile.skills if profile else []
    candidate_projects = profile.projects if profile else []
    candidate_experience = profile.experience if profile else []

    # If no job description or use_benchmark requested, use role expectations
    effective_jd = "" if use_benchmark else (job_description or "")
    jd_analysis = analyze_job_description(effective_jd, target_role)

    # Compute skill gaps and transparent role match score
    gap_analysis = calculate_skill_gap(
        candidate_skills=candidate_skills,
        job_analysis=jd_analysis,
        candidate_projects=candidate_projects,
        candidate_experience=candidate_experience
    )

    # Persist or update JobTarget record for user
    job_target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.created_at.desc()).first()
    if not job_target:
        job_target = JobTarget(user_id=user_id)
        db.session.add(job_target)

    job_target.target_role = target_role
    job_target.target_company = target_company
    job_target.job_description = job_description
    job_target.required_skills = jd_analysis.get("required_skills", [])
    job_target.preferred_skills = jd_analysis.get("preferred_skills", [])
    job_target.interview_topics = gap_analysis.get("interview_topics", [])
    job_target.match_score = gap_analysis.get("match_score", 0.0)
    job_target.match_breakdown = gap_analysis.get("match_breakdown", {})
    job_target.strong_matches = gap_analysis.get("strong_matches", [])
    job_target.partial_matches = gap_analysis.get("partial_matches", [])
    job_target.missing_skills = gap_analysis.get("missing_skills", [])

    # Also update user target_role / target_company
    user = db.session.get(User, user_id)
    if user:
        user.target_role = target_role
        if target_company:
            user.target_company = target_company

    db.session.commit()

    # RAG Pipeline: Index job description chunks into pgvector
    try:
        from services.rag_service import index_job_document
        index_job_document(
            user_id=user_id,
            target_id=job_target.id,
            job_description=effective_jd or (target_role or ""),
            target_role=target_role,
            target_company=target_company,
            job_analysis=jd_analysis
        )
    except Exception as rag_err:
        pass

    return jsonify({
        "success": True,
        "message": "Role & job gap analysis completed.",
        "job_target": job_target.to_dict(),
        "comparison": gap_analysis.get("comparison", {}),
        "candidate_skills_count": len(candidate_skills)
    }), 200


@roles_bp.route("/current", methods=["GET"])
@jwt_required()
def get_current_job_target():
    user_id = int(get_jwt_identity())
    job_target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()

    profile = CandidateProfile.query.filter_by(user_id=user_id).first()

    if not job_target:
        user = db.session.get(User, user_id)
        if user and user.target_role:
            return jsonify({
                "success": True,
                "has_target": True,
                "job_target": {
                    "target_role": user.target_role,
                    "target_company": user.target_company,
                    "match_score": None,
                    "strong_matches": [],
                    "partial_matches": [],
                    "missing_skills": [],
                    "required_skills": []
                },
                "comparison": {},
                "candidate_profile": profile.to_dict() if profile else None
            }), 200
        return jsonify({"success": True, "has_target": False, "job_target": None}), 200

    req_set = set(job_target.required_skills or [])
    comparison = {
        "strong_matches": [
            {
                "skill": s,
                "candidate_level": "Strong",
                "requirement_level": "Required" if s in req_set else "Preferred",
                "notes": "Verified match in candidate profile."
            }
            for s in (job_target.strong_matches or [])
        ],
        "needs_improvement": [
            {
                "skill": s,
                "candidate_level": "Foundational",
                "requirement_level": "Required" if s in req_set else "Preferred",
                "notes": "Partial match detected; deeper interview practice recommended."
            }
            for s in (job_target.partial_matches or [])
        ],
        "missing": [
            {
                "skill": s,
                "candidate_level": "Not detected in resume",
                "requirement_level": "Required" if s in req_set else "Preferred",
                "notes": "Not detected in resume profile; prioritize during preparation."
            }
            for s in (job_target.missing_skills or [])
        ]
    }

    return jsonify({
        "success": True,
        "has_target": True,
        "job_target": job_target.to_dict(),
        "comparison": comparison,
        "candidate_profile": profile.to_dict() if profile else None
    }), 200

