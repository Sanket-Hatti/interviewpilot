from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from models.interview import Interview
from services.ai_service import (
    generate_interview_questions,
    evaluate_interview_answers,
    stream_groq_response,
)

interview_bp = Blueprint("interview", __name__, url_prefix="/api/interview")


@interview_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    role = (data.get("role") or "Software Engineer").strip()
    difficulty = (data.get("difficulty") or "medium").strip().lower()
    if difficulty not in ["easy", "medium", "hard"]:
        difficulty = "medium"
    company = data.get("company", "").strip() or None

    try:
        questions = generate_interview_questions(role, difficulty, company=company)
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500

    all_q = (
        [{"text": q, "type": "technical"} for q in questions.get("technical", [])] +
        [{"text": q, "type": "behavioral"} for q in questions.get("behavioral", [])] +
        [{"text": q, "type": "hr"} for q in questions.get("hr", [])]
    )

    interview = Interview(
        user_id=user_id,
        role=role,
        difficulty=difficulty,
        questions=all_q,
    )
    db.session.add(interview)
    db.session.commit()

    return jsonify({
        "success": True,
        "interview_id": interview.id,
        "role": role,
        "difficulty": difficulty,
        "questions": all_q,
    }), 200


@interview_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    interview_id = data.get("interview_id")
    answers = data.get("answers", [])

    interview = Interview.query.filter_by(id=interview_id, user_id=user_id).first()
    if not interview:
        return jsonify({"success": False, "errors": ["Interview not found."]}), 404

    questions_text = [
        q["text"] if isinstance(q, dict) and "text" in q else str(q)
        for q in (interview.questions or [])
    ]

    try:
        feedback = evaluate_interview_answers(interview.role, questions_text, answers)
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500

    interview.answers = answers
    interview.overall_score = feedback.get("overall_score", 0)
    interview.feedback = feedback
    db.session.commit()

    # Index interview feedback in RAG for future grounded retrieval
    try:
        from services.rag_service import index_interview_feedback_document
        index_interview_feedback_document(
            user_id=user_id,
            interview_id=interview.id,
            role=interview.role,
            feedback=feedback,
            overall_score=float(interview.overall_score or 0)
        )
    except Exception as rag_err:
        import logging
        logging.getLogger(__name__).warning("RAG indexing for interview %s failed: %s", interview.id, rag_err)

    return jsonify({
        "success": True,
        "interview_id": interview.id,
        "overall_score": interview.overall_score,
        "feedback": feedback,
    }), 200


@interview_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    return jsonify({"success": True, "interviews": [i.to_dict() for i in interviews]}), 200


@interview_bp.route("/chat-stream", methods=["POST"])
@jwt_required()
def chat_stream():
    """Real-time SSE streaming for conversational mock interview feedback."""
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"success": False, "errors": ["prompt is required."]}), 400

    def generate():
        for chunk in stream_groq_response(prompt):
            yield f"data: {chunk}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


# ---------------------------------------------------------------------------
# ADAPTIVE AGENTIC MOCK INTERVIEW ENDPOINTS
# ---------------------------------------------------------------------------

@interview_bp.route("/start", methods=["POST"])
@jwt_required()
def start_session():
    """
    Starts an adaptive, turn-by-turn mock interview.
    Generates question 1 grounded in candidate resume and target job context.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    role = (data.get("role") or "").strip() or None
    company = (data.get("company") or "").strip() or None
    interview_type = (data.get("interview_type") or "mixed").strip().lower()
    if interview_type not in ["technical", "behavioral", "mixed"]:
        interview_type = "mixed"

    max_q = data.get("maximum_questions") or data.get("max_questions") or 5

    try:
        from services.adaptive_interview_service import start_adaptive_interview
        session, turn = start_adaptive_interview(
            user_id=user_id,
            role=role,
            company=company,
            interview_type=interview_type,
            maximum_questions=max_q
        )
        return jsonify({
            "success": True,
            "session_id": session.id,
            "session": session.to_dict(),
            "turn": turn.to_dict()
        }), 201
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500


@interview_bp.route("/<int:session_id>/answer", methods=["POST"])
@jwt_required()
def submit_turn_answer(session_id: int):
    """
    Submits answer for active turn.
    Evaluates answer, adapts topic/difficulty, and generates next question or final report.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    answer = (data.get("answer") or "").strip()

    if not answer:
        return jsonify({"success": False, "errors": ["Please provide an answer to evaluate."]}), 400

    try:
        from services.adaptive_interview_service import submit_adaptive_answer
        result = submit_adaptive_answer(user_id=user_id, session_id=session_id, answer=answer)
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"success": False, "errors": [str(ve)]}), 404
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500


@interview_bp.route("/<int:session_id>/state", methods=["GET"])
@jwt_required()
def get_session_state(session_id: int):
    """Returns active session state, current turn, and running scores."""
    user_id = int(get_jwt_identity())
    from models.interview import InterviewSession

    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"success": False, "errors": ["Interview session not found."]}), 404

    active_turn = session.turns.filter_by(turn_number=session.question_number).first()
    return jsonify({
        "success": True,
        "session": session.to_dict(),
        "current_turn": active_turn.to_dict() if active_turn else None
    }), 200


@interview_bp.route("/<int:session_id>/history", methods=["GET"])
@jwt_required()
def get_session_history(session_id: int):
    """Returns full turn-by-turn history, questions, answers, and evaluations for session."""
    user_id = int(get_jwt_identity())
    from models.interview import InterviewSession

    session = InterviewSession.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"success": False, "errors": ["Interview session not found."]}), 404

    turns = session.turns.all()
    return jsonify({
        "success": True,
        "session": session.to_dict(),
        "turns": [t.to_dict() for t in turns]
    }), 200


@interview_bp.route("/<int:session_id>/complete", methods=["POST"])
@jwt_required()
def complete_session(session_id: int):
    """Concludes active session and compiles final diagnostic evaluation report."""
    user_id = int(get_jwt_identity())
    try:
        from services.adaptive_interview_service import complete_adaptive_interview
        result = complete_adaptive_interview(user_id=user_id, session_id=session_id)
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"success": False, "errors": [str(ve)]}), 404
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500


@interview_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    """Lists all adaptive interview sessions for the authenticated user."""
    user_id = int(get_jwt_identity())
    from models.interview import InterviewSession

    sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.created_at.desc()).all()
    return jsonify({
        "success": True,
        "sessions": [s.to_dict() for s in sessions]
    }), 200

