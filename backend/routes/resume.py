import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from config import settings
from database.db import get_db
from models.resume import Resume, Analysis
from models.role import Role
from models.user import User
from schemas.resume import BulletImproveRequest
from services.resume_service import analyze_resume
from services.role_service import match_all_roles
from utils.auth import get_current_user
from utils.file_utils import allowed_file, save_upload

router = APIRouter(prefix="/api/resume", tags=["Resume"])

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "errors": ["Empty filename."]}
        )
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "errors": ["Only PDF files are allowed."]}
        )

    try:
        filename, filepath = save_upload(file, settings.UPLOAD_FOLDER, max_size_bytes=settings.MAX_CONTENT_LENGTH)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "errors": [str(e)]}
        )

    try:
        result = analyze_resume(filepath)
    except ValueError as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"success": False, "errors": [str(e)]}
        )
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "errors": ["Analysis failed. Please try again."]}
        )

    # Save Resume
    resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=filepath,
        raw_text=result["raw_text"],
    )
    db.add(resume)
    db.flush()

    # Save Analysis
    analysis = Analysis(
        resume_id=resume.id,
        resume_score=result["resume_score"],
        extracted_skills=result["extracted_skills"],
        projects=result["projects"],
        education=result["education"],
        experience=result["experience"],
        strengths=result["strengths"],
        weaknesses=result["weaknesses"],
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Match roles
    roles = db.query(Role).all()
    role_matches = match_all_roles(result["extracted_skills"], roles)

    return {
        "success": True,
        "resume_id": resume.id,
        "analysis_id": analysis.id,
        "resume_score": result["resume_score"],
        "extracted_skills": result["extracted_skills"],
        "experience": result["experience"],
        "education": result["education"],
        "projects": result["projects"],
        "strengths": result["strengths"],
        "weaknesses": result["weaknesses"],
        "score_breakdown": result["score_breakdown"],
        "role_matches": role_matches[:5],
    }

@router.get("/history")
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()
    result = []
    for r in resumes:
        latest = db.query(Analysis).filter(Analysis.resume_id == r.id).order_by(Analysis.analyzed_at.desc()).first()
        result.append({
            **r.to_dict(),
            "analysis": latest.to_dict() if latest else None,
        })
    return {"success": True, "resumes": result}

@router.post("/improve")
def improve_bullet(
    data: BulletImproveRequest,
    current_user: User = Depends(get_current_user)
):
    bullet = data.bullet.strip()
    try:
        from services.ai_service import improve_resume_bullet
        improved = improve_resume_bullet(bullet)
        return {"success": True, "original": bullet, "improved": improved}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "errors": [str(e)]}
        )
