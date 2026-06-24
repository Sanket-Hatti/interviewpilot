import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config
from database.db import init_db
from routes.auth      import auth_bp
from routes.resume    import resume_bp
from routes.roles     import roles_bp
from routes.roadmap   import roadmap_bp
from routes.interview import interview_bp
from routes.company   import company_bp


def create_app(env: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config[env])

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    JWTManager(app)
    Limiter(
        get_remote_address,
        app=app,
        default_limits=[app.config["RATELIMIT_DEFAULT"]],
        storage_uri=app.config["RATELIMIT_STORAGE_URL"]
    )

    init_db(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(roadmap_bp)
    app.register_blueprint(interview_bp)
    app.register_blueprint(company_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "version": "2.0.0"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "errors": ["Resource not found."]}), 404

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"success": False, "errors": ["File too large. Max 10MB."]}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "errors": ["Internal server error."]}), 500

    return app


if __name__ == "__main__":
    app = create_app(os.getenv("FLASK_ENV", "development"))
    app.run(host="0.0.0.0", port=5000, debug=True)
