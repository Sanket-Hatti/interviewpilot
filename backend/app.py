import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config
from database.db import init_db
from routes.auth import auth_bp
from routes.resume import resume_bp
from routes.roles import roles_bp
from routes.roadmap import roadmap_bp
from routes.interview import interview_bp
from routes.companies import companies_bp
from routes.code import code_bp
from routes.rag import rag_bp
from routes.agent import agent_bp


def create_app(env: str = "development") -> Flask:
    app = Flask(__name__)
    selected_config = config.get(env, config["default"])
    app.config.from_object(selected_config)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})
    JWTManager(app)
    Limiter(
        get_remote_address,
        app=app,
        default_limits=[app.config["RATELIMIT_DEFAULT"]],
        storage_uri=app.config["RATELIMIT_STORAGE_URL"]
    )

    init_db(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(roadmap_bp)
    app.register_blueprint(interview_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(code_bp)
    app.register_blueprint(rag_bp)
    app.register_blueprint(agent_bp)

    @app.route("/")
    def root():
        return jsonify({
            "status": "ok",
            "message": "Welcome to InterviewPilot API",
            "framework": "Flask",
            "docs": "https://github.com/Sanket-Hatti/interviewpilot",
            "health": "/api/health"
        }), 200

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "version": "3.0.0",
            "framework": "Flask"
        }), 200

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "errors": [str(e.description if hasattr(e, 'description') else "Bad request.")]}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "errors": ["Endpoint not found."]}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"success": False, "errors": ["File too large. Max allowed size is 10MB."]}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"success": False, "errors": ["Internal server error."]}), 500

    @app.errorhandler(503)
    def service_unavailable(e):
        return jsonify({"success": False, "errors": ["Service temporarily unavailable. Please try again."]}), 503

    return app


if __name__ == "__main__":
    app = create_app(os.getenv("FLASK_ENV", "development"))
    app.run(host="0.0.0.0", port=5000, debug=True)
