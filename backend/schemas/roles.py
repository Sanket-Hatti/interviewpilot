from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class MatchRolesRequest(BaseModel):
    skills: List[str] = Field(default_factory=list)

class RoleOut(BaseModel):
    id: int
    role_name: str
    required_skills: List[str]
