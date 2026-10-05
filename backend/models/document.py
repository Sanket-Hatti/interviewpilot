from datetime import datetime, timezone
from database.db import db

# Support pgvector if available, with graceful fallback to JSON
try:
    from pgvector.sqlalchemy import Vector
    VECTOR_AVAILABLE = True
    EMBEDDING_COLUMN_TYPE = Vector(384)
except Exception:
    VECTOR_AVAILABLE = False
    EMBEDDING_COLUMN_TYPE = db.JSON


class Document(db.Model):
    __tablename__ = "documents"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = db.Column(db.String(50), nullable=False, index=True)  # resume, job_description, roadmap, interview_feedback
    source_id     = db.Column(db.String(100), nullable=True, index=True)  # resume_id or job_target_id
    title         = db.Column(db.String(255), nullable=True)
    content       = db.Column(db.Text, nullable=False)
    metadata_json = db.Column("metadata", db.JSON, default=dict)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chunks        = db.relationship(
        "DocumentChunk",
        backref="document",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="DocumentChunk.chunk_index"
    )

    def to_dict(self, include_chunks=False):
        data = {
            "id":            self.id,
            "user_id":       self.user_id,
            "document_type": self.document_type,
            "source_id":     self.source_id,
            "title":         self.title,
            "content":       self.content,
            "metadata":      self.metadata_json or {},
            "created_at":    self.created_at.isoformat() if self.created_at else None,
            "updated_at":    self.updated_at.isoformat() if self.updated_at else None,
            "chunk_count":   len(self.chunks) if self.chunks else 0
        }
        if include_chunks:
            data["chunks"] = [c.to_dict() for c in (self.chunks or [])]
        return data


class DocumentChunk(db.Model):
    __tablename__ = "document_chunks"

    id            = db.Column(db.Integer, primary_key=True)
    document_id   = db.Column(db.Integer, db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index   = db.Column(db.Integer, nullable=False, default=0)
    section       = db.Column(db.String(100), nullable=True, index=True)  # skills, experience, projects, education, etc.
    content       = db.Column(db.Text, nullable=False)
    embedding     = db.Column(EMBEDDING_COLUMN_TYPE, nullable=True)
    metadata_json = db.Column("metadata", db.JSON, default=dict)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_embedding=False):
        data = {
            "id":          self.id,
            "document_id": self.document_id,
            "user_id":     self.user_id,
            "chunk_index": self.chunk_index,
            "section":     self.section,
            "content":     self.content,
            "metadata":    self.metadata_json or {},
            "created_at":  self.created_at.isoformat() if self.created_at else None,
        }
        if include_embedding and self.embedding is not None:
            # Handle both numpy array / list or pgvector representation
            emb = self.embedding
            if hasattr(emb, "tolist"):
                data["embedding"] = emb.tolist()
            elif isinstance(emb, (list, tuple)):
                data["embedding"] = list(emb)
            else:
                data["embedding"] = emb
        return data
