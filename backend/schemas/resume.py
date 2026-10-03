from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class BulletImproveRequest(BaseModel):
    bullet: str = Field(..., min_length=3)

class BulletImproveResponse(BaseModel):
    success: bool = True
    original: str
    improved: str
