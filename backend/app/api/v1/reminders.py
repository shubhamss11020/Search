from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.reminder import Reminder
from app.schemas.application import ReminderOut, ReminderCreate

router = APIRouter(prefix="/reminders", tags=["Follow-up Reminders"])

@router.get("", response_model=List[ReminderOut])
def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.is_dismissed == False
    ).order_by(Reminder.remind_at.asc()).all()

@router.post("", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_in: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = Reminder(
        user_id=current_user.id,
        application_id=reminder_in.application_id,
        title=reminder_in.title,
        reminder_type=reminder_in.reminder_type,
        remind_at=reminder_in.remind_at
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.put("/{reminder_id}/dismiss")
def dismiss_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    reminder.is_dismissed = True
    db.commit()
    return {"id": reminder.id, "is_dismissed": True}
