from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database.db import get_db
from models.interview import Interview
from models.user import User
from schemas.interview import (
    InterviewGenerateRequest,
    InterviewSubmitRequest,
    StreamPromptRequest,
)
from services.ai_service import (
    generate_interview_questions,
    evaluate_interview_answers,
    stream_groq_response,
)
from utils.auth import get_current_user

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/generate")
def generate(
    data: InterviewGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = data.role.strip() or "Software Engineer"
    difficulty = data.difficulty.strip().lower()
    if difficulty not in ["easy", "medium", "hard"]:
        difficulty = "medium"
    company = data.company.strip() if data.company else None

    try:
        questions = generate_interview_questions(role, difficulty, company=company)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "errors": [str(e)]}
        )

    all_q = (
        [{"text": q, "type": "technical"} for q in questions.get("technical", [])] +
        [{"text": q, "type": "behavioral"} for q in questions.get("behavioral", [])] +
        [{"text": q, "type": "hr"} for q in questions.get("hr", [])]
    )

    interview = Interview(
        user_id=current_user.id,
        role=role,
        difficulty=difficulty,
        questions=all_q,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "success": True,
        "interview_id": interview.id,
        "role": role,
        "difficulty": difficulty,
        "questions": all_q,
    }

@router.post("/submit")
def submit(
    data: InterviewSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(
        Interview.id == data.interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "errors": ["Interview not found."]}
        )

    questions_text = [q["text"] for q in (interview.questions or []) if isinstance(q, dict) and "text" in q]

    try:
        feedback = evaluate_interview_answers(interview.role, questions_text, data.answers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "errors": [str(e)]}
        )

    interview.answers = data.answers
    interview.overall_score = feedback.get("overall_score", 0)
    interview.feedback = feedback
    db.commit()

    return {
        "success": True,
        "interview_id": interview.id,
        "overall_score": interview.overall_score,
        "feedback": feedback,
    }

@router.get("/history")
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id
    ).order_by(Interview.created_at.desc()).all()

    return {
        "success": True,
        "interviews": [i.to_dict() for i in interviews]
    }

@router.post("/chat-stream")
async def chat_stream(
    data: StreamPromptRequest,
    current_user: User = Depends(get_current_user)
):
    """Real-time SSE streaming for conversational mock interview feedback."""
    async def event_generator():
        async for chunk in stream_groq_response(data.prompt):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
