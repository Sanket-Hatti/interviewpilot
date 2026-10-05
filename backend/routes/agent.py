"""
InterviewPilot Agent API Routes.
Provides endpoints for querying agent state, obtaining next best action (with autonomous tool calling),
and generating RAG-grounded interview question sessions.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.agent_service import (
    get_agent_state,
    agent_next_action,
    generate_grounded_interview_questions,
    rule_based_next_action
)

logger = logging.getLogger(__name__)

agent_bp = Blueprint("agent", __name__, url_prefix="/api/agent")


@agent_bp.route("/state", methods=["GET"])
@jwt_required()
def state():
    """Retrieve full agent state representation for authenticated user."""
    user_id = int(get_jwt_identity())
    try:
        user_state = get_agent_state(user_id=user_id)
        return jsonify({"success": True, "state": user_state}), 200
    except Exception as e:
        logger.error(f"Error fetching agent state for user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "errors": [str(e)]}), 500


@agent_bp.route("/next-action", methods=["POST", "GET"])
@jwt_required()
def next_action():
    """
    Get recommended next best action using InterviewPilot Agent.
    Executes tool calling against real stored candidate data and falls back gracefully to rule-based logic.
    """
    user_id = int(get_jwt_identity())
    try:
        recommendation = agent_next_action(user_id=user_id)
        return jsonify({"success": True, "recommendation": recommendation}), 200
    except Exception as e:
        logger.error(f"Error computing agent next action for user {user_id}: {e}", exc_info=True)
        fallback = rule_based_next_action(user_id=user_id)
        return jsonify({"success": True, "recommendation": fallback}), 200


@agent_bp.route("/interview", methods=["POST"])
@jwt_required()
def interview():
    """
    Generate interview questions strictly grounded in the candidate's verified resume and target job.
    Anti-hallucination guardrails guarantee questions reflect true candidate projects.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    role = (data.get("role") or "Software Engineer").strip()
    difficulty = (data.get("difficulty") or "medium").strip().lower()
    topic = data.get("topic", "").strip() or None

    try:
        result = generate_grounded_interview_questions(
            user_id=user_id,
            role=role,
            difficulty=difficulty,
            topic=topic
        )
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error generating grounded interview for user {user_id}: {e}", exc_info=True)
        return jsonify({"success": False, "errors": [str(e)]}), 500
