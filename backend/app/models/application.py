from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin, utc_now

class Application(Base, BaseModelMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_user_job_application'),
    )

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_file_id = Column(String(36), ForeignKey("resume_files.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(50), default="NEW", nullable=False) 
    # NEW, SHORTLISTED, READY_TO_APPLY, DRAFTED, APPLIED, INTERVIEW, REJECTED, OFFER, WITHDRAWN
    
    detected_method = Column(String(50), default="AMBIGUOUS", nullable=False)
    # WEBSITE_FORM, EMAIL, RECRUITER_MESSAGE, EXTERNAL_PORTAL, AMBIGUOUS

    method_confidence_pct = Column(Integer, default=50, nullable=False)
    method_explanation = Column(Text, nullable=True)

    # Method-specific extraction fields
    recipient_email = Column(String(255), nullable=True)
    email_subject_instruction = Column(String(255), nullable=True)
    external_portal_url = Column(Text, nullable=True)
    recruiter_name = Column(String(255), nullable=True)
    recruiter_profile_url = Column(Text, nullable=True)

    applied_at = Column(DateTime(timezone=True), nullable=True)
    next_followup_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="application")
    resume_file = relationship("ResumeFile", back_populates="applications")
    drafts = relationship("ApplicationDraft", back_populates="application", cascade="all, delete-orphan")
    events = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")

class ApplicationDraft(Base, BaseModelMixin):
    __tablename__ = "application_drafts"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    draft_type = Column(String(50), nullable=False) # 'FORM_QA', 'COVER_LETTER', 'EMAIL', 'RECRUITER_MESSAGE'
    draft_payload = Column(JSON, default=dict, nullable=False)
    is_reviewed_by_user = Column(Boolean, default=False, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="drafts")

class ApplicationEvent(Base, BaseModelMixin):
    __tablename__ = "application_events"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(50), nullable=False) 
    # 'CREATED', 'DRAFTED', 'FORM_AUTOFILL_COMPLETED', 'CONFIRMED_SUBMITTED', 'STATUS_CHANGED', 'NOTE_ADDED'
    metadata_json = Column(JSON, default=dict, nullable=False)
    occurred_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="events")
