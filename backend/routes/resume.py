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

    # Save file
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    filename, filepath = save_upload(file, upload_folder)

    try:
        result = analyze_resume(filepath)
    except ValueError as e:
        os.remove(filepath)
        return jsonify({"success": False, "errors": [str(e)]}), 422
    except Exception as e:
        os.remove(filepath)
        return jsonify({"success": False, "errors": ["Analysis failed. Please try again."]}), 500

    # Save Resume record
    resume = Resume(
        user_id=user_id,
        filename=filename,
        file_path=filepath,
        raw_text=result["raw_text"],
    )
    db.session.add(resume)
    db.session.flush()  # Get resume.id before commit

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
    db.session.commit()

    # Auto-run role matching with extracted skills
    roles = Role.query.all()
    role_matches = match_all_roles(result["extracted_skills"], roles)

    return jsonify({
        "success":      True,
        "resume_id":    resume.id,
        "analysis_id":  analysis.id,
        "resume_score": result["resume_score"],
        "extracted_skills": result["extracted_skills"],
        "experience":   result["experience"],
        "education":    result["education"],
        "projects":     result["projects"],
        "strengths":    result["strengths"],
        "weaknesses":   result["weaknesses"],
        "score_breakdown": result["score_breakdown"],
        "role_matches": role_matches[:5],  # Top 5 roles
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
    """Improve a resume bullet point using Gemini AI."""
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
