from datetime import datetime, timezone
from database.db import db

class Interview(db.Model):
    __tablename__ = "interviews"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role            = db.Column(db.String(100), nullable=False)
    difficulty      = db.Column(db.String(20), default="medium")  # easy / medium / hard
    questions       = db.Column(db.JSON, default=list)
    answers         = db.Column(db.JSON, default=list)
    overall_score   = db.Column(db.Float, default=0.0)
    feedback        = db.Column(db.JSON, default=dict)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":            self.id,
            "role":          self.role,
            "difficulty":    self.difficulty,
            "questions":     self.questions,
            "answers":       self.answers,
            "overall_score": self.overall_score,
            "feedback":      self.feedback,
            "created_at":    self.created_at.isoformat()
        }
