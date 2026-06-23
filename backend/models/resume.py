from datetime import datetime, timezone
from database.db import db

class Resume(db.Model):
    __tablename__ = "resumes"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    filename    = db.Column(db.String(255), nullable=False)
    file_path   = db.Column(db.String(500), nullable=False)
    raw_text    = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    analyses    = db.relationship("Analysis", backref="resume", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "filename":    self.filename,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class Analysis(db.Model):
    __tablename__ = "analyses"

    id              = db.Column(db.Integer, primary_key=True)
    resume_id       = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)
    resume_score    = db.Column(db.Float, default=0.0)
    extracted_skills = db.Column(db.JSON, default=list)
    projects        = db.Column(db.JSON, default=list)
    education       = db.Column(db.JSON, default=list)
    experience      = db.Column(db.JSON, default=list)
    strengths       = db.Column(db.JSON, default=list)
    weaknesses      = db.Column(db.JSON, default=list)
    analyzed_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":               self.id,
            "resume_id":        self.resume_id,
            "resume_score":     self.resume_score,
            "extracted_skills": self.extracted_skills,
            "projects":         self.projects,
            "education":        self.education,
            "experience":       self.experience,
            "strengths":        self.strengths,
            "weaknesses":       self.weaknesses,
            "analyzed_at":      self.analyzed_at.isoformat()
        }
