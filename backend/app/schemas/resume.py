from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ResumeOut(BaseModel):
    id: str
    user_id: str
    version_name: str
    target_category: Optional[str] = None
    filename: str
    mime_type: str
    file_size_bytes: int
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeUploadResponse(BaseModel):
    resume: ResumeOut
    extracted_text_preview: str
    parsed_skills: list[str] = []
    message: str
