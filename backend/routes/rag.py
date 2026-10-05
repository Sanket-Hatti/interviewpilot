"""
RAG API Routes for InterviewPilot.
Provides endpoints for document indexing, chunk retrieval, and semantic search.
All endpoints strictly enforce JWT authentication and multi-tenant user isolation.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.resume import Resume
from models.candidate import CandidateProfile, JobTarget
from services.rag_service import index_resume_document, index_job_document
from services.retrieval_service import (
    search_resume_context,
    search_job_context,
    search_candidate_context,
    search_interview_feedback
)

logger = logging.getLogger(__name__)

rag_bp = Blueprint("rag", __name__, url_prefix="/api/rag")


@rag_bp.route("/index-resume", methods=["POST"])
@jwt_required()
def index_resume():
    """Trigger semantic chunking and embedding generation for authenticated user's resume."""
    user_id = int(get_jwt_identity())

    profile = CandidateProfile.query.filter_by(user_id=user_id).first()
    resume = Resume.query.filter_by(user_id=user_id).order_by(Resume.uploaded_at.desc()).first()

    raw_text = (resume.raw_text if resume else None) or (profile.skills and "Skills: " + ", ".join(profile.skills))
    if not raw_text and not profile:
        return jsonify({"success": False, "errors": ["No resume found to index. Upload a resume first."]}), 404

    try:
        doc = index_resume_document(
            user_id=user_id,
            raw_text=raw_text or "",
            profile=profile,
            resume_id=resume.id if resume else None
        )
        return jsonify({
            "success": True,
            "message": "Resume successfully indexed in vector store.",
            "document_id": doc.id,
            "chunks_count": len(doc.chunks),
            "sections": list({c.section for c in doc.chunks})
        }), 200
    except Exception as e:
        logger.error(f"Error indexing resume for user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "errors": [str(e)]}), 500


@rag_bp.route("/index-job", methods=["POST"])
@jwt_required()
def index_job():
    """Trigger semantic chunking and embedding generation for target job description."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    role = data.get("role")
    company = data.get("company")
    job_description = data.get("job_description")

    target = JobTarget.query.filter_by(user_id=user_id).order_by(JobTarget.updated_at.desc()).first()

    effective_role = role or (target.target_role if target else "Software Engineer")
    effective_company = company or (target.target_company if target else None)
    effective_jd = job_description or (target.job_description if target else "")

    if not effective_jd and not target:
        return jsonify({"success": False, "errors": ["No job description provided or on file."]}), 400

    try:
        doc = index_job_document(
            user_id=user_id,
            target_role=effective_role,
            target_company=effective_company,
            job_description=effective_jd,
            job_target_id=target.id if target else None,
            analysis_dict=target.match_breakdown if target else None
        )
        return jsonify({
            "success": True,
            "message": "Job description successfully indexed in vector store.",
            "document_id": doc.id,
            "chunks_count": len(doc.chunks),
            "sections": list({c.section for c in doc.chunks})
        }), 200
    except Exception as e:
        logger.error(f"Error indexing job description for user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "errors": [str(e)]}), 500


@rag_bp.route("/search", methods=["POST"])
@jwt_required()
def search():
    """
    Search vector index for authenticated user's documents.
    Enforces strict user isolation: User A can NEVER retrieve User B's chunks.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    query = data.get("query", "").strip()
    if not query:
        return jsonify({"success": False, "errors": ["Query parameter is required."]}), 400

    doc_type = data.get("doc_type", "all").lower()
    top_k = min(int(data.get("top_k", 4)), 10)

    try:
        if doc_type == "resume":
            chunks = search_resume_context(user_id=user_id, query=query, top_k=top_k)
        elif doc_type in ["job", "job_description"]:
            chunks = search_job_context(user_id=user_id, query=query, top_k=top_k)
        elif doc_type in ["interview", "feedback"]:
            chunks = search_interview_feedback(user_id=user_id, query=query, top_k=top_k)
        else:
            chunks = search_candidate_context(user_id=user_id, query=query, top_k=top_k)

        return jsonify({
            "success": True,
            "query": query,
            "doc_type": doc_type,
            "results_count": len(chunks),
            "results": chunks
        }), 200
    except Exception as e:
        logger.error(f"Error searching vector store for user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "errors": [str(e)]}), 500
