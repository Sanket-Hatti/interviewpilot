from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from services.ai_service import generate_json_response
from utils.auth import get_current_user

router = APIRouter(prefix="/api/code", tags=["Code Evaluation"])

class CodeReviewRequest(BaseModel):
    problem: str
    code: str
    language: str = "python"

@router.post("/review")
async def review_code(
    payload: CodeReviewRequest,
    current_user = Depends(get_current_user)
):
    """Analyze candidate code for accuracy, time/space complexity, and optimization."""
    if not payload.code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code cannot be empty")

    prompt = f"""
You are an expert technical interviewer at a top tech company (Google/Meta level).
Review the following candidate solution:

Problem:
{payload.problem}

Language:
{payload.language}

Candidate Code:
{payload.code}

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

    result = await generate_json_response(prompt)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"success": False, "errors": ["AI code evaluation service is currently unavailable. Please try again in a few moments."]}
        )

    return {
        "success": True,
        "evaluation": result
    }
