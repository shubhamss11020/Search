from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class JobMatch(Base, BaseModelMixin):
    __tablename__ = "job_matches"
    __table_args__ = (
        UniqueConstraint('user_id', 'job_id', name='uq_user_job_match'),
    )

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    match_score = Column(Integer, nullable=False, default=0) # 0 to 100
    is_eligible = Column(Boolean, default=True, nullable=False)
    summary_explanation = Column(Text, nullable=False)
    
    matched_skills = Column(JSON, default=list, nullable=False)
    missing_mandatory_skills = Column(JSON, default=list, nullable=False)
    missing_preferred_skills = Column(JSON, default=list, nullable=False)
    eligibility_warnings = Column(JSON, default=list, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="match")
