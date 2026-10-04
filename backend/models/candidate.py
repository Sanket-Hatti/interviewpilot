from datetime import datetime, timezone
from database.db import db

class CandidateProfile(db.Model):
    __tablename__ = "candidate_profiles"

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    resume_id        = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=True)
    skills           = db.Column(db.JSON, default=list)
    projects         = db.Column(db.JSON, default=list)
    experience       = db.Column(db.JSON, default=list)
    education        = db.Column(db.JSON, default=list)
    strengths        = db.Column(db.JSON, default=list)
    weaknesses       = db.Column(db.JSON, default=list)
    resume_score     = db.Column(db.Float, default=0.0)
    raw_text         = db.Column(db.Text, nullable=True)
    updated_at       = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":           self.id,
            "user_id":      self.user_id,
            "resume_id":    self.resume_id,
            "skills":       self.skills or [],
            "projects":     self.projects or [],
            "experience":   self.experience or [],
            "education":    self.education or [],
            "strengths":    self.strengths or [],
            "weaknesses":   self.weaknesses or [],
            "resume_score": self.resume_score,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None
        }


class JobTarget(db.Model):
    __tablename__ = "job_targets"

    id                 = db.Column(db.Integer, primary_key=True)
    user_id            = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    target_role        = db.Column(db.String(120), nullable=False)
    target_company     = db.Column(db.String(120), nullable=True)
    job_description    = db.Column(db.Text, nullable=True)
    required_skills    = db.Column(db.JSON, default=list)
    preferred_skills   = db.Column(db.JSON, default=list)
    interview_topics   = db.Column(db.JSON, default=list)
    match_score        = db.Column(db.Float, default=0.0)
    match_breakdown    = db.Column(db.JSON, default=dict)
    strong_matches     = db.Column(db.JSON, default=list)
    partial_matches    = db.Column(db.JSON, default=list)
    missing_skills     = db.Column(db.JSON, default=list)
    created_at         = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at         = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":               self.id,
            "user_id":          self.user_id,
            "target_role":      self.target_role,
            "target_company":   self.target_company,
            "job_description":  self.job_description,
            "required_skills":  self.required_skills or [],
            "preferred_skills": self.preferred_skills or [],
            "interview_topics": self.interview_topics or [],
            "match_score":      self.match_score,
            "match_breakdown":  self.match_breakdown or {},
            "score_breakdown":  self.match_breakdown or {},
            "strong_matches":   self.strong_matches or [],
            "partial_matches":  self.partial_matches or [],
            "missing_skills":   self.missing_skills or [],
            "created_at":       self.created_at.isoformat() if self.created_at else None,
            "updated_at":       self.updated_at.isoformat() if self.updated_at else None
        }
