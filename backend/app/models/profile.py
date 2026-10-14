from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class CandidateProfile(Base, BaseModelMixin):
    __tablename__ = "candidate_profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    headline = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)

    # Preferences
    preferred_roles = Column(JSON, default=list, nullable=False)
    preferred_locations = Column(JSON, default=list, nullable=False)
    min_salary = Column(Integer, nullable=True)
    work_arrangements = Column(JSON, default=list, nullable=False) # e.g. ["remote", "hybrid"]
    employment_types = Column(JSON, default=list, nullable=False)  # e.g. ["full_time"]

    # Structured details
    skills = Column(JSON, default=list, nullable=False)
    experience = Column(JSON, default=list, nullable=False)
    education = Column(JSON, default=list, nullable=False)
    projects = Column(JSON, default=list, nullable=False)
    certifications = Column(JSON, default=list, nullable=False)
    links = Column(JSON, default=dict, nullable=False) # github, linkedin, portfolio

    # Verified facts for strictly-grounded AI QA
    verified_facts = Column(JSON, default=dict, nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")
