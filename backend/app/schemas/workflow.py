from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class WorkflowClassifyRequest(BaseModel):
    job_id: Optional[str] = None
    description_text: str
    raw_page_snippets: Dict[str, Any] = Field(default_factory=dict)
    application_url: Optional[str] = None

class WorkflowClassifyResponse(BaseModel):
    method: str # WEBSITE_FORM, EMAIL, RECRUITER_MESSAGE, EXTERNAL_PORTAL, AMBIGUOUS
    confidence_pct: int
    explanation: str
    recipient_email: Optional[str] = None
    subject_instruction: Optional[str] = None
    external_portal_url: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_profile_url: Optional[str] = None

class WorkflowDraftRequest(BaseModel):
    job_id: str
    workflow_type: Optional[str] = None # Optional override by user
    questions_to_answer: List[Dict[str, Any]] = Field(default_factory=list) # [{question, max_chars, field_id}]

class WorkflowDraftResponse(BaseModel):
    application_id: str
    workflow_type: str
    email_draft: Optional[Dict[str, Any]] = None # {to, subject, body, attachment_resume_id, attachment_filename}
    form_qa_answers: Optional[List[Dict[str, Any]]] = None # [{field_id, question, answer, grounded_facts}]
    recruiter_message_draft: Optional[Dict[str, Any]] = None # {message, char_count}
    unverified_claims_detected: bool = False
    notes: Optional[str] = None
