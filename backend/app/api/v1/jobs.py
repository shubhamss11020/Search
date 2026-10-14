import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import CandidateProfile
from app.models.job import Job
from app.models.match import JobMatch
from app.models.application import Application, ApplicationEvent
from app.schemas.job import JobIngestRequest, JobIngestResponse, JobOut
from app.schemas.match import JobMatchOut
from app.schemas.workflow import WorkflowClassifyResponse
from app.services.matching_engine import matching_engine
from app.services.method_classifier import method_classifier

router = APIRouter(prefix="/jobs", tags=["Job Discovery & Matching"])

def compute_dedup_hash(company: str, title: str) -> str:
    norm = f"{company.strip().lower()}|{title.strip().lower()}"
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()

@router.post("/ingest", response_model=JobIngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_job(
    job_in: JobIngestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dedup_hash = compute_dedup_hash(job_in.company, job_in.title)

    # Check for existing job for this user
    existing_job = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.dedup_hash == dedup_hash
    ).first()

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()

    # Calculate match
    match_result = matching_engine.calculate_match(
        profile=profile,
        job_title=job_in.title,
        job_description=job_in.description_text,
        job_skills=job_in.skills_required
    )

    # Classify application method
    workflow_result = await method_classifier.classify_application_method(
        description_text=job_in.description_text,
        raw_snippets=job_in.raw_page_snippets,
        application_url=job_in.application_url
    )

    is_duplicate = False

    if existing_job:
        is_duplicate = True
        job = existing_job
        # Update details if fresh
        job.description_text = job_in.description_text
        if job_in.source_posted_at:
            job.source_posted_at = job_in.source_posted_at
        if job_in.application_url:
            job.application_url = job_in.application_url
        
        # Update match record
        match = db.query(JobMatch).filter(JobMatch.job_id == job.id).first()
        if match:
            for k, v in match_result.items():
                setattr(match, k, v)
        else:
            match = JobMatch(user_id=current_user.id, job_id=job.id, **match_result)
            db.add(match)

        db.commit()
        db.refresh(job)
        db.refresh(match)
    else:
        # Create new job
        job = Job(
            user_id=current_user.id,
            source_id=job_in.source_id,
            external_job_id=job_in.external_job_id,
            dedup_hash=dedup_hash,
            title=job_in.title,
            company=job_in.company,
            location=job_in.location,
            employment_type=job_in.employment_type,
            experience_level=job_in.experience_level,
            salary_raw=job_in.salary_raw,
            salary_min=job_in.salary_min,
            salary_max=job_in.salary_max,
            currency=job_in.currency,
            description_text=job_in.description_text,
            skills_required=job_in.skills_required,
            application_url=job_in.application_url,
            source_posted_at=job_in.source_posted_at,
            raw_page_snippets=job_in.raw_page_snippets
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Create Match record
        match = JobMatch(
            user_id=current_user.id,
            job_id=job.id,
            **match_result
        )
        db.add(match)

        # Create initial Application record
        application = Application(
            user_id=current_user.id,
            job_id=job.id,
            status="NEW",
            detected_method=workflow_result["method"],
            method_confidence_pct=workflow_result["confidence_pct"],
            method_explanation=workflow_result["explanation"],
            recipient_email=workflow_result.get("recipient_email"),
            email_subject_instruction=workflow_result.get("subject_instruction"),
            external_portal_url=workflow_result.get("external_portal_url"),
            recruiter_name=workflow_result.get("recruiter_name"),
            recruiter_profile_url=workflow_result.get("recruiter_profile_url")
        )
        db.add(application)
        db.flush()
        
        # Log event
        event = ApplicationEvent(
            application_id=application.id,
            user_id=current_user.id,
            event_type="CREATED",
            metadata_json={"source": job_in.source_id, "title": job_in.title}
        )
        db.add(event)

        db.commit()
        db.refresh(match)
        db.refresh(job)

    job_out = JobOut(
        id=job.id,
        user_id=job.user_id,
        source_id=job.source_id,
        external_job_id=job.external_job_id,
        dedup_hash=job.dedup_hash,
        title=job.title,
        company=job.company,
        location=job.location,
        employment_type=job.employment_type,
        experience_level=job.experience_level,
        salary_raw=job.salary_raw,
        description_text=job.description_text,
        skills_required=job.skills_required or [],
        application_url=job.application_url,
        source_posted_at=job.source_posted_at,
        discovered_at=job.discovered_at,
        is_saved=job.is_saved,
        is_dismissed=job.is_dismissed,
        match=JobMatchOut.model_validate(match),
        detected_method=workflow_result["method"],
        application_status="NEW"
    )

    return JobIngestResponse(
        job=job_out,
        is_duplicate=is_duplicate,
        match=JobMatchOut.model_validate(match),
        workflow=WorkflowClassifyResponse(**workflow_result)
    )

@router.get("", response_model=List[JobOut])
def list_jobs(
    recency_window: Optional[str] = Query("all", description="1h, 24h, 3d, 7d, all"),
    min_match_score: int = Query(0, ge=0, le=100),
    source_id: Optional[str] = Query(None),
    is_saved: Optional[bool] = Query(None),
    sort_by: str = Query("best_match", description="best_match, newest_posted, newest_discovered"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Job).outerjoin(JobMatch, Job.id == JobMatch.job_id).outerjoin(Application, Job.id == Application.job_id).filter(
        Job.user_id == current_user.id,
        Job.is_dismissed == False
    )

    # Recency filter: Distinguishes source-reported posting time from discovery time!
    now = datetime.now(timezone.utc)
    if recency_window == "1h":
        cutoff = now - timedelta(hours=1)
        query = query.filter(or_(Job.source_posted_at >= cutoff, Job.discovered_at >= cutoff))
    elif recency_window == "24h":
        cutoff = now - timedelta(hours=24)
        query = query.filter(or_(Job.source_posted_at >= cutoff, Job.discovered_at >= cutoff))
    elif recency_window == "3d":
        cutoff = now - timedelta(days=3)
        query = query.filter(or_(Job.source_posted_at >= cutoff, Job.discovered_at >= cutoff))
    elif recency_window == "7d":
        cutoff = now - timedelta(days=7)
        query = query.filter(or_(Job.source_posted_at >= cutoff, Job.discovered_at >= cutoff))

    # Min match score filter
    if min_match_score > 0:
        query = query.filter(JobMatch.match_score >= min_match_score)

    # Source filter
    if source_id and source_id != "all":
        query = query.filter(Job.source_id == source_id)

    # Saved filter
    if is_saved is not None:
        query = query.filter(Job.is_saved == is_saved)

    # Search query
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(Job.title.ilike(search_filter), Job.company.ilike(search_filter), Job.description_text.ilike(search_filter)))

    # Sorting
    if sort_by == "best_match":
        query = query.order_by(desc(JobMatch.match_score), desc(Job.discovered_at))
    elif sort_by == "newest_posted":
        query = query.order_by(desc(Job.source_posted_at.nulls_last()), desc(Job.discovered_at))
    else: # newest_discovered
        query = query.order_by(desc(Job.discovered_at))

    jobs = query.limit(100).all()

    # Hydrate schemas
    output = []
    for j in jobs:
        match_obj = db.query(JobMatch).filter(JobMatch.job_id == j.id).first()
        app_obj = db.query(Application).filter(Application.job_id == j.id).first()
        output.append(JobOut(
            id=j.id,
            user_id=j.user_id,
            source_id=j.source_id,
            external_job_id=j.external_job_id,
            dedup_hash=j.dedup_hash,
            title=j.title,
            company=j.company,
            location=j.location,
            employment_type=j.employment_type,
            experience_level=j.experience_level,
            salary_raw=j.salary_raw,
            description_text=j.description_text,
            skills_required=j.skills_required or [],
            application_url=j.application_url,
            source_posted_at=j.source_posted_at,
            discovered_at=j.discovered_at,
            is_saved=j.is_saved,
            is_dismissed=j.is_dismissed,
            match=JobMatchOut.model_validate(match_obj) if match_obj else None,
            application_status=app_obj.status if app_obj else "NEW",
            detected_method=app_obj.detected_method if app_obj else "WEBSITE_FORM"
        ))

    return output

@router.put("/{job_id}/save")
def toggle_save_job(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_saved = not job.is_saved
    db.commit()
    return {"id": job.id, "is_saved": job.is_saved}

@router.put("/{job_id}/dismiss")
def dismiss_job(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_dismissed = True
    db.commit()
    return {"id": job.id, "is_dismissed": True}
