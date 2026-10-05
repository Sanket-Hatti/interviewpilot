"""
Retrieval & RAG Context Service for InterviewPilot.
Performs user-isolated vector similarity search against indexed document chunks in PostgreSQL (pgvector).
Enforces strict security boundary: a candidate can NEVER retrieve another user's document chunks.
"""

import logging
from typing import List, Dict, Any, Optional
from database.db import db
from models.document import Document, DocumentChunk
from services.embedding_service import generate_embedding, cosine_similarity

logger = logging.getLogger(__name__)


def _vector_search_chunks(
    user_id: int,
    query: str,
    document_types: Optional[List[str]] = None,
    sections: Optional[List[str]] = None,
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    Core vector similarity search engine with strict user isolation.
    Uses pgvector native cosine distance (<=>) with Python similarity fallback.
    """
    if not query or not query.strip() or not user_id:
        return []

    query_emb = generate_embedding(query.strip())
    results = []

    try:
        # Build query strictly filtered by user_id
        q = (
            db.session.query(DocumentChunk, Document.document_type, Document.title)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(DocumentChunk.user_id == user_id)
        )

        if document_types:
            q = q.filter(Document.document_type.in_(document_types))

        if sections:
            q = q.filter(DocumentChunk.section.in_(sections))

        # Query using pgvector cosine distance operator
        q = q.order_by(DocumentChunk.embedding.cosine_distance(query_emb).asc()).limit(top_k)
        rows = q.all()

        for chunk, doc_type, doc_title in rows:
            # Calculate similarity score: cosine similarity = 1 - cosine_distance
            # Or evaluate via embedding vectors
            emb_list = chunk.embedding
            if hasattr(emb_list, "tolist"):
                emb_list = emb_list.tolist()
            sim = cosine_similarity(query_emb, emb_list) if emb_list else 0.5

            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "document_type": doc_type,
                "document_title": doc_title,
                "section": chunk.section,
                "content": chunk.content,
                "similarity": round(float(sim), 4),
                "metadata": chunk.metadata_json or {}
            })

    except Exception as e:
        logger.warning(f"pgvector query encountered error, falling back to memory rank: {e}")
        # In-memory fallback with strict user isolation
        try:
            chunks = (
                db.session.query(DocumentChunk, Document.document_type, Document.title)
                .join(Document, DocumentChunk.document_id == Document.id)
                .filter(DocumentChunk.user_id == user_id)
            )
            if document_types:
                chunks = chunks.filter(Document.document_type.in_(document_types))
            if sections:
                chunks = chunks.filter(DocumentChunk.section.in_(sections))

            all_chunks = chunks.all()
            scored = []
            for chunk, doc_type, doc_title in all_chunks:
                emb = chunk.embedding
                if hasattr(emb, "tolist"):
                    emb = emb.tolist()
                sim = cosine_similarity(query_emb, emb) if emb else 0.0
                scored.append({
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "document_type": doc_type,
                    "document_title": doc_title,
                    "section": chunk.section,
                    "content": chunk.content,
                    "similarity": round(float(sim), 4),
                    "metadata": chunk.metadata_json or {}
                })
            scored.sort(key=lambda x: x["similarity"], reverse=True)
            results = scored[:top_k]
        except Exception as inner_e:
            logger.error(f"Fallback retrieval failed: {inner_e}")
            results = []

    return results


def search_resume_context(user_id: int, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """Retrieve top relevant chunks from candidate's resume (Strictly user-isolated)."""
    return _vector_search_chunks(user_id, query, document_types=["resume"], top_k=top_k)


def search_job_context(user_id: int, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """Retrieve top relevant chunks from target job description (Strictly user-isolated)."""
    return _vector_search_chunks(user_id, query, document_types=["job_description"], top_k=top_k)


def search_candidate_context(user_id: int, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve relevant context across both resume and target job description."""
    return _vector_search_chunks(user_id, query, document_types=["resume", "job_description"], top_k=top_k)


def search_interview_feedback(user_id: int, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Retrieve prior interview feedback and performance notes for the user."""
    return _vector_search_chunks(user_id, query, document_types=["interview_feedback"], top_k=top_k)


def construct_rag_context(
    user_id: int,
    query: str,
    include_resume: bool = True,
    include_job: bool = True,
    top_k: int = 4
) -> str:
    """
    Constructs grounded, compact context string to inject into LLM prompts.
    Avoids sending whole resumes or full job postings every time.
    """
    types = []
    if include_resume:
        types.append("resume")
    if include_job:
        types.append("job_description")

    chunks = _vector_search_chunks(user_id, query, document_types=types, top_k=top_k)
    if not chunks:
        return ""

    context_lines = ["--- RELEVANT RETRIEVED CONTEXT ---"]
    for i, c in enumerate(chunks, 1):
        src = f"[{c['document_type'].upper()} - {c['section'].upper()}]"
        context_lines.append(f"{i}. {src} (Score: {c['similarity']}):\n{c['content'].strip()}")
    context_lines.append("--- END CONTEXT ---")
    return "\n\n".join(context_lines)
