from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from models.role import Role
from services.role_service import match_all_roles, match_role

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
        "success":      True,
        "user_skills":  user_skills,
        "total_roles":  len(results),
        "matches":      results,
        "best_match":   results[0] if results else None,
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
        "success":   True,
        "role_name": role.role_name,
        **result,
    }), 200
