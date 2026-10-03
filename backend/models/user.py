from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from database.db import Base
import bcrypt

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String(120), nullable=False)
    email         = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    resumes       = relationship("Resume",      back_populates="user", cascade="all, delete-orphan")
    roadmaps      = relationship("Roadmap",     back_populates="user", cascade="all, delete-orphan")
    interviews    = relationship("Interview",   back_populates="user", cascade="all, delete-orphan")
    dsa_progress  = relationship("DSAProgress", back_populates="user", cascade="all, delete-orphan")
    chat_history  = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")

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
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<User {self.email}>"
