from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        import models.user
        import models.resume
        import models.candidate
        import models.role
        import models.roadmap
        import models.interview
        import models.company
        import models.dsa
        import models.chat
        try:
            db.create_all()
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goal VARCHAR(120);"))
                conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS target_role VARCHAR(120);"))
                conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS target_company VARCHAR(120);"))
                conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_id INTEGER;"))
                conn.execute(db.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;"))
                conn.commit()
        except Exception as e:
            app.logger.warning(f"Database connection warning on startup: {e}")

