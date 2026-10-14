from typing import List
from datetime import datetime
from pydantic import BaseModel, Field

class JobMatchOut(BaseModel):
    id: str
    job_id: str
    match_score: int
    is_eligible: bool
    summary_explanation: str
    matched_skills: List[str] = Field(default_factory=list)
    missing_mandatory_skills: List[str] = Field(default_factory=list)
    missing_preferred_skills: List[str] = Field(default_factory=list)
    eligibility_warnings: List[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True
