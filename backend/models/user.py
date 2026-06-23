from datetime import datetime, timezone
from database.db import db
import bcrypt

class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    full_name     = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    resumes       = db.relationship("Resume",      backref="user", lazy=True, cascade="all, delete-orphan")
    roadmaps      = db.relationship("Roadmap",     backref="user", lazy=True, cascade="all, delete-orphan")
    interviews    = db.relationship("Interview",   backref="user", lazy=True, cascade="all, delete-orphan")
    dsa_progress  = db.relationship("DSAProgress", backref="user", lazy=True, cascade="all, delete-orphan")
    chat_history  = db.relationship("ChatHistory", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.password_hash.encode("utf-8")
        )

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "full_name":  self.full_name,
            "email":      self.email,
            "created_at": self.created_at.isoformat()
        }

    def __repr__(self):
        return f"<User {self.email}>"
