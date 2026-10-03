from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_role       = Column(String(100), nullable=False)
    missing_skills    = Column(JSON, default=list)
    weekly_hours      = Column(Integer, default=10)
    duration_weeks    = Column(Integer, default=8)  # 4, 8, or 12
    roadmap_data      = Column(JSON, default=dict)  # week-by-week plan
    completion_pct    = Column(Float, default=0.0)
    created_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user              = relationship("User", back_populates="roadmaps")

    def to_dict(self):
        return {
            "id":             self.id,
            "target_role":    self.target_role,
            "missing_skills": self.missing_skills,
            "weekly_hours":   self.weekly_hours,
            "duration_weeks": self.duration_weeks,
            "roadmap_data":   self.roadmap_data,
            "completion_pct": self.completion_pct,
            "created_at":     self.created_at.isoformat() if self.created_at else None
        }
