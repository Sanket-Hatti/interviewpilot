from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ai_service import generate_json_response
from services.candidate_context_service import record_practice_performance

code_bp = Blueprint("code", __name__, url_prefix="/api/code")


@code_bp.route("/review", methods=["POST"])
@jwt_required()
def review_code():
    """Analyze candidate code for accuracy, time/space complexity, and optimization."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    problem = (data.get("problem") or "").strip()
    code = (data.get("code") or "").strip()
    language = (data.get("language") or "python").strip()
    topic = (data.get("topic") or "").strip() or "Algorithms & Data Structures"
    problem_name = (data.get("problem_name") or "").strip() or (problem[:40] if problem else "Code Challenge")

    if not code:
        return jsonify({"success": False, "errors": ["Code cannot be empty."]}), 400

    prompt = f"""
You are an expert technical interviewer at a top tech company (Google/Meta level).
Review the following candidate solution:

Problem:
{problem}

Language:
{language}

Candidate Code:
{code}

Evaluate the code rigorously and return a JSON object with this exact structure:
{{
  "score": <integer 0-100>,
  "is_correct": <boolean>,
  "time_complexity": "<e.g. O(N) or O(N log N) with brief explanation>",
  "space_complexity": "<e.g. O(1) or O(N) with brief explanation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "edge_cases": [
    {{"case": "<description of edge case>", "passed": <boolean>}}
  ],
  "review_summary": "<2-3 sentence executive review>",
  "optimized_code": "<clean, production-grade refactored code with inline comments in the specified language>"
}}
"""

    result = generate_json_response(prompt)
    if not result:
        return jsonify({
            "success": False,
            "errors": ["AI code evaluation service is currently unavailable. Please try again in a few moments."]
        }), 503

    # Connect practice loop: automatically record performance to candidate state & RAG
    try:
        score_val = float(result.get("score", 70))
        failed_cases = [ec.get("case") for ec in result.get("edge_cases", []) if isinstance(ec, dict) and not ec.get("passed")]
        record_practice_performance(
            user_id=user_id,
            topic=topic,
            score=score_val,
            problem_name=problem_name,
            practice_type="coding",
            mistakes=failed_cases,
            concepts_missed=failed_cases[:2],
            feedback=result
        )
    except Exception as e:
        # Don't break review response if recording encounters transient issue
        pass

    return jsonify({
        "success": True,
        "evaluation": result
    }), 200


@code_bp.route("/record", methods=["POST"])
@jwt_required()
def record_practice():
    """Directly record practice or drill session performance."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()
    score = data.get("score")
    problem_name = (data.get("problem_name") or "").strip() or None
    practice_type = data.get("practice_type") or "coding"
    mistakes = data.get("mistakes") or []
    concepts_missed = data.get("concepts_missed") or []
    feedback = data.get("feedback") or {}

    if not topic or score is None:
        return jsonify({"success": False, "errors": ["Topic and score are required."]}), 400

    try:
        activity = record_practice_performance(
            user_id=user_id,
            topic=topic,
            score=float(score),
            problem_name=problem_name,
            practice_type=practice_type,
            mistakes=mistakes,
            concepts_missed=concepts_missed,
            feedback=feedback
        )
        return jsonify({"success": True, "activity": activity.to_dict()}), 200
    except Exception as e:
        return jsonify({"success": False, "errors": [str(e)]}), 500
