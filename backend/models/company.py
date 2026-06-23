from database.db import db

class CompanyPreparation(db.Model):
    __tablename__ = "company_preparation"

    id                   = db.Column(db.Integer, primary_key=True)
    company_name         = db.Column(db.String(100), unique=True, nullable=False)
    interview_pattern    = db.Column(db.JSON, default=dict)
    frequent_topics      = db.Column(db.JSON, default=list)
    prep_strategy        = db.Column(db.Text)
    difficulty_level     = db.Column(db.String(20), default="medium")
    logo_url             = db.Column(db.String(300))

    def to_dict(self):
        return {
            "id":                self.id,
            "company_name":      self.company_name,
            "interview_pattern": self.interview_pattern,
            "frequent_topics":   self.frequent_topics,
            "prep_strategy":     self.prep_strategy,
            "difficulty_level":  self.difficulty_level
        }
