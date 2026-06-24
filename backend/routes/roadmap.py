from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.roadmap import Roadmap
from services.ai_service import generate_roadmap

roadmap_bp = Blueprint("roadmap", __name__, url_prefix="/api/roadmap")


@roadmap_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    target_role    = (data.get("target_role") or "").strip()
    missing_skills = data.get("missing_skills", [])
    weekly_hours   = int(data.get("weekly_hours", 10))
    duration_weeks = int(data.get("duration_weeks", 8))

    if not target_role:
        return jsonify({"success": False, "errors": ["target_role is required."]}), 400
    if duration_weeks not in [4, 8, 12]:
        duration_weeks = 8

    try:
        roadmap_data = generate_roadmap(target_role, missing_skills, weekly_hours, duration_weeks)
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500

    roadmap = Roadmap(
        user_id=user_id,
        target_role=target_role,
        missing_skills=missing_skills,
        weekly_hours=weekly_hours,
        duration_weeks=duration_weeks,
        roadmap_data=roadmap_data,
    )
    db.session.add(roadmap)
    db.session.commit()

    return jsonify({
        "success":        True,
        "roadmap_id":     roadmap.id,
        "target_role":    target_role,
        "duration_weeks": duration_weeks,
        "weekly_hours":   weekly_hours,
        "roadmap":        roadmap_data,
    }), 200


@roadmap_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    roadmaps = Roadmap.query.filter_by(user_id=user_id).order_by(Roadmap.created_at.desc()).all()
    return jsonify({"success": True, "roadmaps": [r.to_dict() for r in roadmaps]}), 200


@roadmap_bp.route("/<int:roadmap_id>", methods=["GET"])
@jwt_required()
def get_roadmap(roadmap_id):
    user_id = int(get_jwt_identity())
    roadmap = Roadmap.query.filter_by(id=roadmap_id, user_id=user_id).first()
    if not roadmap:
        return jsonify({"success": False, "errors": ["Roadmap not found."]}), 404
    return jsonify({"success": True, "roadmap": roadmap.to_dict()}), 200
