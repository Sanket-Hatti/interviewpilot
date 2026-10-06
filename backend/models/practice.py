from datetime import datetime, timezone
from database.db import db

class PracticeActivity(db.Model):
    __tablename__ = "practice_activities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    topic = db.Column(db.String(100), nullable=False, index=True)
    practice_type = db.Column(db.String(50), default="coding")  # coding, algorithm, technical_concept, quiz
    problem_name = db.Column(db.String(255), nullable=True)
    score = db.Column(db.Float, nullable=False)  # 0 to 100
    questions_attempted = db.Column(db.Integer, default=1)
    mistakes = db.Column(db.JSON, default=list)
    concepts_missed = db.Column(db.JSON, default=list)
    feedback = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "topic": self.topic,
            "practice_type": self.practice_type,
            "problem_name": self.problem_name,
            "score": round(float(self.score), 1) if self.score is not None else 0.0,
            "questions_attempted": self.questions_attempted,
            "mistakes": self.mistakes or [],
            "concepts_missed": self.concepts_missed or [],
            "feedback": self.feedback or {},
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
