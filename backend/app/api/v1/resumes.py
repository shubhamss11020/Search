import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import ResumeFile
from app.models.profile import CandidateProfile
from app.schemas.resume import ResumeOut, ResumeUploadResponse
from app.services.storage_service import storage_service
from app.services.resume_parser import resume_parser

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    version_name: str = Form("General Resume"),
    target_category: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate mime type
    if not file.filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported formats: PDF, DOCX, TXT"
        )

    # Read bytes for parsing
    content_bytes = await file.read()
    await file.seek(0) # reset for storage

    # Extract text
    if file.filename.lower().endswith('.pdf'):
        parsed_text = resume_parser.extract_text_from_pdf(content_bytes)
    else:
        parsed_text = content_bytes.decode('utf-8', errors='ignore')

    # Save to storage
    file_key, file_size = await storage_service.save_file(file, current_user.id)

    # If is_primary, unset any existing primary resume
    if is_primary:
        db.query(ResumeFile).filter(ResumeFile.user_id == current_user.id).update({"is_primary": False})

    # Save resume record
    resume_record = ResumeFile(
        user_id=current_user.id,
        version_name=version_name,
        target_category=target_category,
        file_key=file_key,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
        parsed_content=parsed_text,
        is_primary=is_primary
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    # Parse structured profile facts via LLM
    extracted_profile = await resume_parser.parse_resume_to_profile(parsed_text)

    # Update candidate profile if empty or requested
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if profile:
        if extracted_profile.get("headline") and not profile.headline:
            profile.headline = extracted_profile["headline"]
        if extracted_profile.get("phone") and not profile.phone:
            profile.phone = extracted_profile["phone"]
        if extracted_profile.get("skills"):
            profile.skills = extracted_profile["skills"]
        if extracted_profile.get("experience"):
            profile.experience = extracted_profile["experience"]
        if extracted_profile.get("education"):
            profile.education = extracted_profile["education"]
        if extracted_profile.get("projects"):
            profile.projects = extracted_profile["projects"]
        db.commit()

    skills_preview = [s.get("name", "") for s in extracted_profile.get("skills", []) if isinstance(s, dict)]

    return ResumeUploadResponse(
        resume=ResumeOut.model_validate(resume_record),
        extracted_text_preview=parsed_text[:400] + "...",
        parsed_skills=skills_preview,
        message="Resume uploaded and parsed successfully. Please review profile facts in the dashboard."
    )

@router.get("", response_model=List[ResumeOut])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ResumeFile).filter(ResumeFile.user_id == current_user.id).order_by(ResumeFile.created_at.desc()).all()

@router.get("/{resume_id}/download")
def download_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(ResumeFile).filter(
        ResumeFile.id == resume_id,
        ResumeFile.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    file_path = storage_service.get_file_path(resume.file_key)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File content missing from storage")

    return FileResponse(
        path=file_path,
        filename=resume.filename,
        media_type=resume.mime_type
    )

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(ResumeFile).filter(
        ResumeFile.id == resume_id,
        ResumeFile.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    storage_service.delete_file(resume.file_key)
    db.delete(resume)
    db.commit()
    return None
