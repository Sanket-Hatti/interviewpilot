from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class Interview(Base):
    __tablename__ = "interviews"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    role            = Column(String(100), nullable=False)
    difficulty      = Column(String(20), default="medium")  # easy / medium / hard
    questions       = Column(JSON, default=list)
    answers         = Column(JSON, default=list)
    overall_score   = Column(Float, default=0.0)
    feedback        = Column(JSON, default=dict)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user            = relationship("User", back_populates="interviews")

    def to_dict(self):
        return {
            "id":            self.id,
            "role":          self.role,
            "difficulty":    self.difficulty,
            "questions":     self.questions,
            "answers":       self.answers,
            "overall_score": self.overall_score,
            "feedback":      self.feedback,
            "created_at":    self.created_at.isoformat() if self.created_at else None
        }
