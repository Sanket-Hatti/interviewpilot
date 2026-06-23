from database.db import db

class Role(db.Model):
    __tablename__ = "roles"

    id              = db.Column(db.Integer, primary_key=True)
    role_name       = db.Column(db.String(100), unique=True, nullable=False)
    required_skills = db.Column(db.JSON, default=list)

    def to_dict(self):
        return {
            "id":              self.id,
            "role_name":       self.role_name,
            "required_skills": self.required_skills
        }

    def __repr__(self):
        return f"<Role {self.role_name}>"
