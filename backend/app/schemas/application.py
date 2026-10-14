from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.job import JobOut

class ApplicationOut(BaseModel):
    id: str
    user_id: str
    job_id: str
    resume_file_id: Optional[str] = None
    status: str
    detected_method: str
    method_confidence_pct: int
    method_explanation: Optional[str] = None
    recipient_email: Optional[str] = None
    email_subject_instruction: Optional[str] = None
    external_portal_url: Optional[str] = None
    recruiter_name: Optional[str] = None
    applied_at: Optional[datetime] = None
    next_followup_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True

class ApplicationStatusUpdate(BaseModel):
    status: str # NEW, SHORTLISTED, READY_TO_APPLY, DRAFTED, APPLIED, INTERVIEW, REJECTED, OFFER, WITHDRAWN
    resume_file_id: Optional[str] = None
    notes: Optional[str] = None
    next_followup_at: Optional[datetime] = None

class ReminderCreate(BaseModel):
    application_id: Optional[str] = None
    title: str
    reminder_type: str = "FOLLOW_UP"
    remind_at: datetime

class ReminderOut(BaseModel):
    id: str
    user_id: str
    application_id: Optional[str] = None
    title: str
    reminder_type: str
    remind_at: datetime
    is_dismissed: bool
    created_at: datetime

    class Config:
        from_attributes = True
