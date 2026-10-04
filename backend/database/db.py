from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        import models.user
        import models.resume
        import models.role
        import models.roadmap
        import models.interview
        import models.company
        import models.dsa
        import models.chat
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning(f"Database connection warning on startup: {e}")
