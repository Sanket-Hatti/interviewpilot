from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from services.ai_service import generate_json_response

code_bp = Blueprint("code", __name__, url_prefix="/api/code")


@code_bp.route("/review", methods=["POST"])
@jwt_required()
def review_code():
    """Analyze candidate code for accuracy, time/space complexity, and optimization."""
    data = request.get_json(silent=True) or {}
    problem = (data.get("problem") or "").strip()
    code = (data.get("code") or "").strip()
    language = (data.get("language") or "python").strip()

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

    return jsonify({
        "success": True,
        "evaluation": result
    }), 200
