from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.role import Role
from models.user import User
from schemas.roles import MatchRolesRequest
from services.role_service import match_all_roles, match_role
from utils.auth import get_current_user

router = APIRouter(prefix="/api/roles", tags=["Roles"])

@router.get("/")
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).order_by(Role.role_name).all()
    return {
        "success": True,
        "roles": [r.to_dict() for r in roles]
    }

@router.post("/match")
def match(
    data: MatchRolesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = data.skills
    if not user_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "errors": ["skills array is required."]}
        )

    roles = db.query(Role).all()
    results = match_all_roles(user_skills, roles)

    return {
        "success": True,
        "user_skills": user_skills,
        "total_roles": len(results),
        "matches": results,
        "best_match": results[0] if results else None,
    }

@router.post("/match/{role_id}")
def match_specific(
    role_id: int,
    data: MatchRolesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "errors": ["Role not found."]}
        )

    result = match_role(data.skills, role.required_skills)
    return {
        "success": True,
        "role_name": role.role_name,
        **result,
    }
