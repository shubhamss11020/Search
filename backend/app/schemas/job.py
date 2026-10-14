from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.match import JobMatchOut
from app.schemas.workflow import WorkflowClassifyResponse

class JobIngestRequest(BaseModel):
    source_id: str = "generic" # linkedin, naukri, generic, manual
    external_job_id: Optional[str] = None
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_raw: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    description_text: str
    skills_required: List[str] = Field(default_factory=list)
    application_url: Optional[str] = None
    source_posted_at: Optional[datetime] = None
    raw_page_snippets: Dict[str, Any] = Field(default_factory=dict)

class JobOut(BaseModel):
    id: str
    user_id: str
    source_id: str
    external_job_id: Optional[str] = None
    dedup_hash: str
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_raw: Optional[str] = None
    description_text: str
    skills_required: List[str] = Field(default_factory=list)
    application_url: Optional[str] = None
    source_posted_at: Optional[datetime] = None
    discovered_at: datetime
    is_saved: bool
    is_dismissed: bool
    match: Optional[JobMatchOut] = None
    application_status: Optional[str] = None
    detected_method: Optional[str] = None

    class Config:
        from_attributes = True

class JobIngestResponse(BaseModel):
    job: JobOut
    is_duplicate: bool
    match: JobMatchOut
    workflow: WorkflowClassifyResponse
