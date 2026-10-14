import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.application import Application, ApplicationEvent, ApplicationDraft
from app.schemas.application import ApplicationOut, ApplicationStatusUpdate
from app.schemas.job import JobOut

router = APIRouter(prefix="/applications", tags=["Application Tracking"])

@router.get("", response_model=List[ApplicationOut])
def list_applications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if status_filter and status_filter != "all":
        query = query.filter(Application.status == status_filter.upper())
    
    apps = query.order_by(Application.updated_at.desc()).all()
    results = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        app_dict = ApplicationOut.model_validate(app)
        if job:
            app_dict.job = JobOut.model_validate(job)
        results.append(app_dict)
    return results

@router.put("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: str,
    update_in: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = application.status
    new_status = update_in.status.upper()
    application.status = new_status

    if new_status == "APPLIED" and not application.applied_at:
        application.applied_at = datetime.now(timezone.utc)

    if update_in.resume_file_id:
        application.resume_file_id = update_in.resume_file_id
    if update_in.notes is not None:
        application.notes = update_in.notes
    if update_in.next_followup_at:
        application.next_followup_at = update_in.next_followup_at

    # Log transition event
    event = ApplicationEvent(
        application_id=application.id,
        user_id=current_user.id,
        event_type="STATUS_CHANGED",
        metadata_json={"from": old_status, "to": new_status}
    )
    db.add(event)
    db.commit()
    db.refresh(application)

    job = db.query(Job).filter(Job.id == application.job_id).first()
    app_out = ApplicationOut.model_validate(application)
    if job:
        app_out.job = JobOut.model_validate(job)
    return app_out

@router.get("/export/csv")
def export_applications_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports application tracker records to a clean CSV file.
    """
    applications = db.query(Application).filter(Application.user_id == current_user.id).order_by(Application.created_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Job Title", "Company", "Location", "Source", "Status",
        "Application Method", "Applied Date", "Next Follow-up", "Notes", "Job URL"
    ])

    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        writer.writerow([
            job.title if job else "N/A",
            job.company if job else "N/A",
            job.location if job else "",
            job.source_id if job else "manual",
            app.status,
            app.detected_method,
            app.applied_at.strftime("%Y-%m-%d %H:%M") if app.applied_at else "",
            app.next_followup_at.strftime("%Y-%m-%d") if app.next_followup_at else "",
            app.notes or "",
            job.application_url if job else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job_applications_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
