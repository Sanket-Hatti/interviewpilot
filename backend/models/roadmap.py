from datetime import datetime, timezone
from database.db import db

class Roadmap(db.Model):
    __tablename__ = "roadmaps"

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    target_role       = db.Column(db.String(100), nullable=False)
    missing_skills    = db.Column(db.JSON, default=list)
    weekly_hours      = db.Column(db.Integer, default=10)
    duration_weeks    = db.Column(db.Integer, default=8)  # 4, 8, or 12
    roadmap_data      = db.Column(db.JSON, default=dict)  # week-by-week plan
    completion_pct    = db.Column(db.Float, default=0.0)
    created_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":             self.id,
            "target_role":    self.target_role,
            "missing_skills": self.missing_skills,
            "weekly_hours":   self.weekly_hours,
            "duration_weeks": self.duration_weeks,
            "roadmap_data":   self.roadmap_data,
            "completion_pct": self.completion_pct,
            "created_at":     self.created_at.isoformat()
        }
