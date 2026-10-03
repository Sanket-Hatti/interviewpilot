from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class Resume(Base):
    __tablename__ = "resumes"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename    = Column(String(255), nullable=False)
    file_path   = Column(String(500), nullable=False)
    raw_text    = Column(Text)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user        = relationship("User", back_populates="resumes")
    analyses    = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":          self.id,
            "filename":    self.filename,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class Analysis(Base):
    __tablename__ = "analyses"

    id               = Column(Integer, primary_key=True, index=True)
    resume_id        = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    resume_score     = Column(Float, default=0.0)
    extracted_skills = Column(JSON, default=list)
    projects         = Column(JSON, default=list)
    education        = Column(JSON, default=list)
    experience       = Column(JSON, default=list)
    strengths        = Column(JSON, default=list)
    weaknesses       = Column(JSON, default=list)
    analyzed_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resume           = relationship("Resume", back_populates="analyses")

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
            "analyzed_at":      self.analyzed_at.isoformat() if self.analyzed_at else None
        }
