from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import CandidateProfile
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.services.storage_service import storage_service

router = APIRouter(prefix="/profile", tags=["Candidate Profile"])

@router.get("", response_model=ProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("", response_model=ProfileOut)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_and_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes all profile data, resumes, saved jobs, and applications for the user.
    Strictly fulfills GDPR / Data Deletion compliance.
    """
    storage_service.delete_user_files(current_user.id)
    
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if profile:
        db.delete(profile)
    
    db.commit()
    return None
