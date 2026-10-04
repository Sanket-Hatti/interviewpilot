import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from models.resume import Resume, Analysis
from models.role import Role
from services.resume_service import analyze_resume
from services.role_service import match_all_roles
from utils.file_utils import allowed_file, save_upload

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resume")


@resume_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"success": False, "errors": ["No file uploaded."]}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"success": False, "errors": ["Empty filename."]}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "errors": ["Only PDF files are allowed."]}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    max_size = current_app.config.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)

    try:
        filename, filepath = save_upload(file, upload_folder, max_size_bytes=max_size)
    except ValueError as e:
        return jsonify({"success": False, "errors": [str(e)]}), 400
    except Exception as e:
        return jsonify({"success": False, "errors": ["File upload failed."]}), 500

    try:
        result = analyze_resume(filepath)
    except ValueError as e:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        return jsonify({"success": False, "errors": [str(e)]}), 422
    except Exception as e:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        return jsonify({"success": False, "errors": ["Analysis failed. Please try again."]}), 500

    # Save Resume record
    resume = Resume(
        user_id=user_id,
        filename=filename,
        file_path=filepath,
        raw_text=result["raw_text"],
    )
    db.session.add(resume)
    db.session.flush()

    # Save Analysis record
    analysis = Analysis(
        resume_id=resume.id,
        resume_score=result["resume_score"],
        extracted_skills=result["extracted_skills"],
        projects=result["projects"],
        education=result["education"],
        experience=result["experience"],
        strengths=result["strengths"],
        weaknesses=result["weaknesses"],
    )
    db.session.add(analysis)

    # Save or update CandidateProfile record
    from models.candidate import CandidateProfile
    from models.user import User
    
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = CandidateProfile(user_id=user_id)
        db.session.add(profile)

    profile.resume_id = resume.id
    profile.skills = result["extracted_skills"]
    profile.projects = result["projects"]
    profile.experience = result["experience"]
    profile.education = result["education"]
    profile.strengths = result["strengths"]
    profile.weaknesses = result["weaknesses"]
    profile.resume_score = result["resume_score"]
    profile.raw_text = result["raw_text"]

    user = db.session.get(User, user_id)
    if user:
        user.resume_id = resume.id

    db.session.commit()

    # Auto-run role matching with extracted skills
    roles = Role.query.all()
    role_matches = match_all_roles(result["extracted_skills"], roles)

    return jsonify({
        "success": True,
        "resume_id": resume.id,
        "analysis_id": analysis.id,
        "resume_score": result["resume_score"],
        "extracted_skills": result["extracted_skills"],
        "experience": result["experience"],
        "education": result["education"],
        "projects": result["projects"],
        "strengths": result["strengths"],
        "weaknesses": result["weaknesses"],
        "score_breakdown": result["score_breakdown"],
        "role_matches": role_matches[:5],
        "profile": profile.to_dict()
    }), 200


@resume_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_candidate_profile():
    from models.candidate import CandidateProfile
    user_id = int(get_jwt_identity())
    profile = CandidateProfile.query.filter_by(user_id=user_id).first()

    # Backfill profile from latest Resume & Analysis if not yet in CandidateProfile
    if not profile:
        latest_resume = Resume.query.filter_by(user_id=user_id).order_by(Resume.uploaded_at.desc()).first()
        if latest_resume:
            latest_analysis = Analysis.query.filter_by(resume_id=latest_resume.id).order_by(Analysis.analyzed_at.desc()).first()
            if latest_analysis:
                profile = CandidateProfile(
                    user_id=user_id,
                    resume_id=latest_resume.id,
                    skills=latest_analysis.extracted_skills or [],
                    projects=latest_analysis.projects or [],
                    experience=latest_analysis.experience or [],
                    education=latest_analysis.education or [],
                    strengths=latest_analysis.strengths or [],
                    weaknesses=latest_analysis.weaknesses or [],
                    resume_score=latest_analysis.resume_score or 0.0,
                    raw_text=latest_resume.raw_text
                )
                db.session.add(profile)
                db.session.commit()

    if not profile:
        return jsonify({"success": True, "has_profile": False, "profile": None}), 200

    return jsonify({
        "success": True,
        "has_profile": True,
        "profile": profile.to_dict()
    }), 200


@resume_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.uploaded_at.desc()).all()
    result = []
    for r in resumes:
        latest = Analysis.query.filter_by(resume_id=r.id).order_by(Analysis.analyzed_at.desc()).first()
        result.append({
            **r.to_dict(),
            "analysis": latest.to_dict() if latest else None,
        })
    return jsonify({"success": True, "resumes": result}), 200


@resume_bp.route("/improve", methods=["POST"])
@jwt_required()
def improve_bullet():
    data = request.get_json(silent=True) or {}
    bullet = (data.get("bullet") or "").strip()
    if not bullet:
        return jsonify({"success": False, "errors": ["Bullet text is required."]}), 400

    try:
        from services.ai_service import improve_resume_bullet
        improved = improve_resume_bullet(bullet)
        return jsonify({"success": True, "original": bullet, "improved": improved}), 200
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500
