from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.roadmap import Roadmap
from models.user import User
from schemas.roadmap import RoadmapGenerateRequest, RoadmapGenerateResponse
from services.ai_service import generate_roadmap
from utils.auth import get_current_user

router = APIRouter(prefix="/api/roadmap", tags=["Roadmap"])

@router.post("/generate")
def generate(
    data: RoadmapGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = data.target_role.strip()
    missing_skills = data.missing_skills
    weekly_hours = data.weekly_hours
    duration_weeks = data.duration_weeks if data.duration_weeks in [4, 8, 12] else 8

    try:
        roadmap_data = generate_roadmap(target_role, missing_skills, weekly_hours, duration_weeks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "errors": [str(e)]}
        )

    roadmap = Roadmap(
        user_id=current_user.id,
        target_role=target_role,
        missing_skills=missing_skills,
        weekly_hours=weekly_hours,
        duration_weeks=duration_weeks,
        roadmap_data=roadmap_data,
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    return {
        "success": True,
        "roadmap_id": roadmap.id,
        "target_role": target_role,
        "duration_weeks": duration_weeks,
        "weekly_hours": weekly_hours,
        "roadmap": roadmap_data,
    }

@router.get("/history")
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(Roadmap).filter(Roadmap.user_id == current_user.id).order_by(Roadmap.created_at.desc()).all()
    return {
        "success": True,
        "roadmaps": [r.to_dict() for r in roadmaps]
    }

@router.get("/{roadmap_id}")
def get_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "errors": ["Roadmap not found."]}
        )
    return {
        "success": True,
        "roadmap": roadmap.to_dict()
    }
