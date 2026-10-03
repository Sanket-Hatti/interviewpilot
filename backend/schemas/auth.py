from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, description="Full name of user")
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    created_at: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    access_token: Optional[str] = None
    user: Optional[UserResponse] = None
