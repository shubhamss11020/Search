from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.profile import CandidateProfile
from app.models.job import Job
from app.models.resume import ResumeFile
from app.models.application import Application, ApplicationDraft, ApplicationEvent
from app.schemas.workflow import (
    WorkflowClassifyRequest,
    WorkflowClassifyResponse,
    WorkflowDraftRequest,
    WorkflowDraftResponse
)
from app.services.method_classifier import method_classifier
from app.services.ai_generator import ai_generator

router = APIRouter(prefix="/workflows", tags=["Application Workflows"])

@router.post("/classify", response_model=WorkflowClassifyResponse)
async def classify_method(
    req: WorkflowClassifyRequest,
    current_user: User = Depends(get_current_user)
):
    result = await method_classifier.classify_application_method(
        description_text=req.description_text,
        raw_snippets=req.raw_page_snippets,
        application_url=req.application_url
    )
    return WorkflowClassifyResponse(**result)

@router.post("/draft", response_model=WorkflowDraftResponse)
async def draft_application(
    req: WorkflowDraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Lookup Job & Application
    job = db.query(Job).filter(Job.id == req.job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    application = db.query(Application).filter(Application.job_id == job.id).first()
    if not application:
        application = Application(
            user_id=current_user.id,
            job_id=job.id,
            status="NEW",
            detected_method="WEBSITE_FORM",
            method_confidence_pct=80
        )
        db.add(application)
        db.commit()
        db.refresh(application)

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Candidate profile must be configured before drafting applications")

    # Determine workflow type (user override takes precedence)
    workflow_type = req.workflow_type or application.detected_method

    email_draft = None
    form_qa_answers = None
    recruiter_message_draft = None

    if workflow_type == "EMAIL":
        recipient = application.recipient_email or "hiring-team@company.com"
        email_result = await ai_generator.generate_email_application(
            profile=profile,
            job_title=job.title,
            company=job.company,
            recipient_email=recipient,
            subject_instruction=application.email_subject_instruction
        )
        # Find primary or newest resume version
        primary_resume = db.query(ResumeFile).filter(
            ResumeFile.user_id == current_user.id
        ).order_by(ResumeFile.is_primary.desc(), ResumeFile.created_at.desc()).first()

        email_draft = {
            **email_result,
            "attachment_resume_id": primary_resume.id if primary_resume else None,
            "attachment_filename": primary_resume.filename if primary_resume else None
        }

        # Save draft
        draft_record = ApplicationDraft(
            application_id=application.id,
            user_id=current_user.id,
            draft_type="EMAIL",
            draft_payload=email_draft
        )
        db.add(draft_record)

    elif workflow_type == "RECRUITER_MESSAGE":
        recruiter_draft = await ai_generator.generate_recruiter_message(
            profile=profile,
            job_title=job.title,
            company=job.company,
            recruiter_name=application.recruiter_name
        )
        recruiter_message_draft = recruiter_draft

        draft_record = ApplicationDraft(
            application_id=application.id,
            user_id=current_user.id,
            draft_type="RECRUITER_MESSAGE",
            draft_payload=recruiter_draft
        )
        db.add(draft_record)

    else: # WEBSITE_FORM or EXTERNAL_PORTAL
        # Default questions if none provided from content script
        questions_to_process = req.questions_to_answer or [
            {"field_id": "q1", "question": "Why do you want to join our company?", "max_chars": 500},
            {"field_id": "q2", "question": "Describe a relevant technical project you built.", "max_chars": 800}
        ]
        qa_results = await ai_generator.generate_form_answers(
            questions=questions_to_process,
            profile=profile,
            job_title=job.title,
            company=job.company,
            description=job.description_text
        )
        form_qa_answers = qa_results

        draft_record = ApplicationDraft(
            application_id=application.id,
            user_id=current_user.id,
            draft_type="FORM_QA",
            draft_payload={"answers": qa_results}
        )
        db.add(draft_record)

    # Transition status to DRAFTED
    application.status = "DRAFTED"
    
    # Log event
    event = ApplicationEvent(
        application_id=application.id,
        user_id=current_user.id,
        event_type="DRAFTED",
        metadata_json={"workflow_type": workflow_type}
    )
    db.add(event)
    db.commit()

    return WorkflowDraftResponse(
        application_id=application.id,
        workflow_type=workflow_type,
        email_draft=email_draft,
        form_qa_answers=form_qa_answers,
        recruiter_message_draft=recruiter_message_draft,
        unverified_claims_detected=False,
        notes="Draft prepared. Verify and review before manual submission or sending."
    )
