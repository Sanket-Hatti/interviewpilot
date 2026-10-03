from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from utils.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    clean_email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"success": False, "errors": ["Email already registered."]}
        )

    user = User(
        full_name=data.full_name.strip(),
        email=clean_email
    )
    user.set_password(data.password)
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "message": "Account created successfully.",
        "access_token": access_token,
        "user": user.to_dict()
    }

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    clean_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not user.check_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "errors": ["Invalid email or password."]}
        )

    access_token = create_access_token(user.id)

    return {
        "success": True,
        "access_token": access_token,
        "user": user.to_dict()
    }

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "user": current_user.to_dict()
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "Logged out successfully."
    }
