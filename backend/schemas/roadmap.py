from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class RoadmapGenerateRequest(BaseModel):
    target_role: str = Field(..., min_length=1)
    missing_skills: List[str] = Field(default_factory=list)
    weekly_hours: int = Field(default=10, ge=1, le=80)
    duration_weeks: int = Field(default=8)

class RoadmapGenerateResponse(BaseModel):
    success: bool = True
    roadmap_id: int
    target_role: str
    duration_weeks: int
    weekly_hours: int
    roadmap: Dict[str, Any]
