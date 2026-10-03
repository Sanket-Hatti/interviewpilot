from sqlalchemy import Column, Integer, String, Text, JSON
from database.db import Base

class CompanyPreparation(Base):
    __tablename__ = "company_preparation"

    id                   = Column(Integer, primary_key=True, index=True)
    company_name         = Column(String(100), unique=True, nullable=False)
    interview_pattern    = Column(JSON, default=dict)
    frequent_topics      = Column(JSON, default=list)
    prep_strategy        = Column(Text)
    difficulty_level     = Column(String(20), default="medium")
    logo_url             = Column(String(300))

    def to_dict(self):
        return {
            "id":                self.id,
            "company_name":      self.company_name,
            "interview_pattern": self.interview_pattern,
            "frequent_topics":   self.frequent_topics,
            "prep_strategy":     self.prep_strategy,
            "difficulty_level":  self.difficulty_level
        }
