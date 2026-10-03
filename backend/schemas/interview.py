from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class InterviewGenerateRequest(BaseModel):
    role: str = Field(default="Software Engineer")
    difficulty: str = Field(default="medium")
    company: Optional[str] = Field(default=None)

class InterviewSubmitRequest(BaseModel):
    interview_id: int
    answers: List[str]

class QuestionItem(BaseModel):
    id: int
    type: str
    question: str

class InterviewGenerateResponse(BaseModel):
    success: bool = True
    interview_id: int
    role: str
    difficulty: str
    questions: List[QuestionItem]

class EvaluationData(BaseModel):
    overall_score: float
    technical_accuracy: float
    communication: float
    completeness: float
    detailed_feedback: List[str]
    suggested_improvements: List[str]

class InterviewSubmitResponse(BaseModel):
    success: bool = True
    evaluation: EvaluationData

class StreamPromptRequest(BaseModel):
    prompt: str
