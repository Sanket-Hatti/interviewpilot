from sqlalchemy import Column, Integer, String, JSON
from database.db import Base

class Role(Base):
    __tablename__ = "roles"

    id              = Column(Integer, primary_key=True, index=True)
    role_name       = Column(String(100), unique=True, nullable=False)
    required_skills = Column(JSON, default=list)

    def to_dict(self):
        return {
            "id":              self.id,
            "role_name":       self.role_name,
            "required_skills": self.required_skills
        }

    def __repr__(self):
        return f"<Role {self.role_name}>"
