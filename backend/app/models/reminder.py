from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import BaseModelMixin

class Reminder(Base, BaseModelMixin):
    __tablename__ = "reminders"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    reminder_type = Column(String(50), default="FOLLOW_UP", nullable=False) # 'FOLLOW_UP', 'INTERVIEW', 'INCOMPLETE_DRAFT'
    remind_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="reminders")
