import json
from datetime import datetime

from pydantic import BaseModel, field_validator


def _parse_json_list(v):
    """Parse a JSON string to a list, or return as-is if already a list."""
    if v is None:
        return None
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, list) else None
        except (json.JSONDecodeError, TypeError):
            return None
    return None


class SkillResponse(BaseModel):
    id: int
    name: str
    category: str | None

    model_config = {"from_attributes": True}


class UserSkillResponse(BaseModel):
    id: str
    skill: SkillResponse
    proficiency: str | None
    years: float | None

    model_config = {"from_attributes": True}


class WorkExperienceCreate(BaseModel):
    company: str
    title: str
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    description: str | None = None
    highlights: list[str] | None = None


class WorkExperienceResponse(WorkExperienceCreate):
    id: str

    @field_validator("highlights", mode="before")
    @classmethod
    def parse_highlights(cls, v):
        return _parse_json_list(v)

    model_config = {"from_attributes": True}


class EducationCreate(BaseModel):
    institution: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    gpa: float | None = None


class EducationResponse(EducationCreate):
    id: str

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    headline: str | None = None
    summary: str | None = None
    current_location: str | None = None
    preferred_locations: list[str] | None = None
    open_to_remote: bool | None = None
    open_to_relocation: bool | None = None
    desired_job_titles: list[str] | None = None
    desired_industries: list[str] | None = None
    desired_salary_min: int | None = None
    desired_salary_max: int | None = None
    salary_currency: str | None = None
    job_type_preferences: list[str] | None = None
    requires_visa_sponsorship: bool | None = None


class ProfileResponse(BaseModel):
    id: str
    headline: str | None
    summary: str | None
    years_of_experience: int | None
    current_location: str | None
    preferred_locations: list[str] | None = None
    open_to_remote: bool
    desired_job_titles: list[str] | None = None
    desired_salary_min: int | None
    desired_salary_max: int | None
    requires_visa_sponsorship: bool
    skills: list[UserSkillResponse] = []
    work_experiences: list[WorkExperienceResponse] = []
    education: list[EducationResponse] = []
    created_at: datetime

    @field_validator("preferred_locations", mode="before")
    @classmethod
    def parse_preferred_locations(cls, v):
        return _parse_json_list(v)

    @field_validator("desired_job_titles", mode="before")
    @classmethod
    def parse_desired_job_titles(cls, v):
        return _parse_json_list(v)

    model_config = {"from_attributes": True}


class CareerPreferencesUpdate(BaseModel):
    desired_job_titles: list[str]
    desired_industries: list[str] | None = None
    preferred_locations: list[str] | None = None
    open_to_remote: bool = True
    job_type_preferences: list[str] = ["full-time"]
    desired_salary_min: int | None = None
    desired_salary_max: int | None = None
    requires_visa_sponsorship: bool = False
