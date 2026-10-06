from datetime import datetime, timezone
from database.db import db


class Interview(db.Model):
    __tablename__ = "interviews"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role            = db.Column(db.String(100), nullable=False)
    difficulty      = db.Column(db.String(20), default="medium")  # easy / medium / hard
    questions       = db.Column(db.JSON, default=list)
    answers         = db.Column(db.JSON, default=list)
    overall_score   = db.Column(db.Float, default=0.0)
    feedback        = db.Column(db.JSON, default=dict)
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

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


class InterviewSession(db.Model):
    """
    Adaptive Agentic Interview Session.
    Maintains dynamic state, topic coverage, running difficulty, and weak/strong areas.
    """
    __tablename__ = "interview_sessions"

    id                = db.Column(db.Integer, primary_key=True)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    target_role       = db.Column(db.String(120), nullable=False)
    target_company    = db.Column(db.String(120), nullable=True)
    interview_type    = db.Column(db.String(50), default="mixed")  # technical, behavioral, mixed
    status            = db.Column(db.String(30), default="in_progress")  # in_progress, completed, abandoned
    question_number   = db.Column(db.Integer, default=1)
    maximum_questions = db.Column(db.Integer, default=5)
    current_topic     = db.Column(db.String(120), nullable=True)
    current_difficulty= db.Column(db.String(20), default="medium")  # easy, medium, hard
    covered_topics    = db.Column(db.JSON, default=list)
    weak_topics       = db.Column(db.JSON, default=list)
    strong_topics     = db.Column(db.JSON, default=list)
    recent_scores     = db.Column(db.JSON, default=list)
    overall_score     = db.Column(db.Float, default=0.0)
    final_report      = db.Column(db.JSON, default=dict)
    created_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    turns = db.relationship(
        "InterviewTurn",
        backref="session",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="InterviewTurn.turn_number.asc()"
    )

    def to_dict(self):
        return {
            "id":                 self.id,
            "user_id":            self.user_id,
            "target_role":        self.target_role,
            "target_company":     self.target_company,
            "interview_type":     self.interview_type,
            "status":             self.status,
            "question_number":    self.question_number,
            "maximum_questions":  self.maximum_questions,
            "current_topic":      self.current_topic,
            "current_difficulty": self.current_difficulty,
            "covered_topics":     self.covered_topics or [],
            "weak_topics":        self.weak_topics or [],
            "strong_topics":      self.strong_topics or [],
            "recent_scores":      self.recent_scores or [],
            "overall_score":      self.overall_score,
            "final_report":       self.final_report or {},
            "created_at":         self.created_at.isoformat() if self.created_at else None,
            "updated_at":         self.updated_at.isoformat() if self.updated_at else None
        }


class InterviewTurn(db.Model):
    """
    Individual turn within an Adaptive Agentic Interview.
    Tracks single question, grounding context, candidate answer, and real-time evaluation.
    """
    __tablename__ = "interview_turns"

    id                  = db.Column(db.Integer, primary_key=True)
    session_id          = db.Column(db.Integer, db.ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    turn_number         = db.Column(db.Integer, nullable=False)
    question            = db.Column(db.Text, nullable=False)
    question_type       = db.Column(db.String(60), default="Technical Concept")
    topic               = db.Column(db.String(120), nullable=False)
    difficulty          = db.Column(db.String(20), default="medium")
    adaptation_reason   = db.Column(db.Text, nullable=True)
    rag_context         = db.Column(db.JSON, default=dict)
    answer              = db.Column(db.Text, nullable=True)
    score               = db.Column(db.Float, nullable=True)
    strengths           = db.Column(db.JSON, default=list)
    weaknesses          = db.Column(db.JSON, default=list)
    missing_concepts    = db.Column(db.JSON, default=list)
    feedback            = db.Column(db.Text, nullable=True)
    evaluation          = db.Column(db.JSON, default=dict)
    next_action_decision= db.Column(db.JSON, default=dict)
    created_at          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    answered_at         = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id":                   self.id,
            "session_id":           self.session_id,
            "user_id":              self.user_id,
            "turn_number":          self.turn_number,
            "question":             self.question,
            "question_type":        self.question_type,
            "topic":                self.topic,
            "difficulty":           self.difficulty,
            "adaptation_reason":    self.adaptation_reason,
            "rag_context":          self.rag_context or {},
            "answer":               self.answer,
            "score":                self.score,
            "strengths":            self.strengths or [],
            "weaknesses":           self.weaknesses or [],
            "missing_concepts":     self.missing_concepts or [],
            "feedback":             self.feedback,
            "evaluation":           self.evaluation or {},
            "next_action_decision": self.next_action_decision or {},
            "created_at":           self.created_at.isoformat() if self.created_at else None,
            "answered_at":          self.answered_at.isoformat() if self.answered_at else None
        }
