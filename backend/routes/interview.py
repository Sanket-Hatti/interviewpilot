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
