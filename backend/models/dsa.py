from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

DSA_TOPICS = [
    "Arrays", "Strings", "Linked Lists", "Stack",
    "Queue", "Trees", "Graphs", "Dynamic Programming"
]

class DSAProgress(Base):
    __tablename__ = "dsa_progress"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic        = Column(String(60), nullable=False)
    problem_name = Column(String(200), nullable=False)
    difficulty   = Column(String(20), default="medium")  # easy / medium / hard
    solved       = Column(Boolean, default=True)
    date_solved  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes        = Column(Text)

    user         = relationship("User", back_populates="dsa_progress")

    def to_dict(self):
        return {
            "id":           self.id,
            "topic":        self.topic,
            "problem_name": self.problem_name,
            "difficulty":   self.difficulty,
            "solved":       self.solved,
            "date_solved":  self.date_solved.isoformat() if self.date_solved else None,
            "notes":        self.notes
        }
