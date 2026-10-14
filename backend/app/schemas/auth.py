from datetime import datetime
from pydantic import BaseModel, field_validator
import re

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

    @field_validator("email")
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(EMAIL_REGEX, v):
            raise ValueError("Invalid email format")
        return v

class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
