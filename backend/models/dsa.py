from datetime import datetime, timezone
from database.db import db

DSA_TOPICS = [
    "Arrays", "Strings", "Linked Lists", "Stack",
    "Queue", "Trees", "Graphs", "Dynamic Programming"
]

class DSAProgress(db.Model):
    __tablename__ = "dsa_progress"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    topic        = db.Column(db.String(60), nullable=False)
    problem_name = db.Column(db.String(200), nullable=False)
    difficulty   = db.Column(db.String(20), default="medium")  # easy / medium / hard
    solved       = db.Column(db.Boolean, default=True)
    date_solved  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notes        = db.Column(db.Text)

    def to_dict(self):
        return {
            "id":           self.id,
            "topic":        self.topic,
            "problem_name": self.problem_name,
            "difficulty":   self.difficulty,
            "solved":       self.solved,
            "date_solved":  self.date_solved.isoformat(),
            "notes":        self.notes
        }
