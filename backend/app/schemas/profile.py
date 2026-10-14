from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class SkillItem(BaseModel):
    name: str
    category: Optional[str] = "general" # e.g. "backend", "frontend", "devops", "cloud"
    level: Optional[str] = "intermediate" # "beginner", "intermediate", "expert"
    years: Optional[float] = None

class ExperienceItem(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    highlights: List[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: str
    tech_stack: List[str] = Field(default_factory=list)
    url: Optional[str] = None

class ProfileBase(BaseModel):
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    preferred_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    min_salary: Optional[int] = None
    work_arrangements: List[str] = Field(default_factory=list)
    employment_types: List[str] = Field(default_factory=list)
    skills: List[SkillItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    links: Dict[str, str] = Field(default_factory=dict)
    verified_facts: Dict[str, Any] = Field(default_factory=dict)

class ProfileUpdate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
