from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class ResumeFile(Base, BaseModelMixin):
    __tablename__ = "resume_files"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version_name = Column(String(100), nullable=False) # e.g. "Full Stack General"
    target_category = Column(String(100), nullable=True) # e.g. "Backend / Python"
    file_key = Column(String(512), nullable=False) # S3 or local path
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    parsed_content = Column(Text, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="resumes")
    applications = relationship("Application", back_populates="resume_file")
