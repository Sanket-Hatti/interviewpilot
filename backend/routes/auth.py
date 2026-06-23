from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database.db import db
from models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def validate_register_input(data: dict):
    errors = []
    if not data.get("full_name") or len(data["full_name"].strip()) < 2:
        errors.append("Full name must be at least 2 characters.")
    if not data.get("email") or "@" not in data["email"]:
        errors.append("A valid email is required.")
    if not data.get("password") or len(data["password"]) < 6:
        errors.append("Password must be at least 6 characters.")
    return errors


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    errors = validate_register_input(data)
    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"success": False, "errors": ["Email already registered."]}), 409

    user = User(
        full_name=data["full_name"].strip(),
        email=data["email"].lower().strip()
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": "Account created successfully.",
        "access_token": access_token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "errors": ["Email and password are required."]}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "errors": ["Invalid email or password."]}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": "Logged in successfully.",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "errors": ["User not found."]}), 404
    return jsonify({"success": True, "user": user.to_dict()}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    # JWT is stateless — client drops the token.
    # For production, add a token denylist (Redis).
    return jsonify({"success": True, "message": "Logged out successfully."}), 200
