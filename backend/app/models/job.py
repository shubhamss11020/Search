from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin, utc_now

class Job(Base, BaseModelMixin):
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint('user_id', 'dedup_hash', name='uq_user_job_dedup'),
    )

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(50), nullable=False, default="generic") # 'linkedin', 'naukri', etc.
    external_job_id = Column(String(255), nullable=True)
    dedup_hash = Column(String(64), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(50), nullable=True)
    experience_level = Column(String(50), nullable=True)
    
    salary_raw = Column(String(255), nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    currency = Column(String(10), nullable=True)

    description_text = Column(Text, nullable=False)
    skills_required = Column(JSON, default=list, nullable=False)
    application_url = Column(Text, nullable=True)

    source_posted_at = Column(DateTime(timezone=True), nullable=True, index=True) # platform reported time
    discovered_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True) # ingestion time

    is_saved = Column(Boolean, default=False, nullable=False)
    is_dismissed = Column(Boolean, default=False, nullable=False)

    # Raw snippets for method classification (e.g. apply button text, footer notes)
    raw_page_snippets = Column(JSON, default=dict, nullable=False)

    # Relationships
    user = relationship("User", back_populates="jobs")
    match = relationship("JobMatch", back_populates="job", uselist=False, cascade="all, delete-orphan")
    application = relationship("Application", back_populates="job", uselist=False, cascade="all, delete-orphan")
