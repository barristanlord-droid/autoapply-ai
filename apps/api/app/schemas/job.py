import json
import uuid
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


class JobSearchParams(BaseModel):
    query: str | None = None
    location: str | None = None
    is_remote: bool | None = None
    job_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    experience_level: str | None = None
    visa_sponsorship: bool | None = None
    page: int = 1
    page_size: int = 20


class JobListingResponse(BaseModel):
    id: str
    title: str
    company_name: str
    company_logo_url: str | None
    location: str | None
    is_remote: bool
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    job_type: str | None
    experience_level: str | None
    required_skills: list[str] | None = None
    source: str
    source_url: str | None
    posted_at: datetime | None
    match_score: float | None = None  # computed per-user

    @field_validator("required_skills", mode="before")
    @classmethod
    def parse_required_skills(cls, v):
        return _parse_json_list(v)

    model_config = {"from_attributes": True}


class JobDetailResponse(JobListingResponse):
    description: str
    preferred_skills: list[str] | None = None
    min_years_experience: int | None
    education_requirement: str | None
    visa_sponsorship: bool | None
    apply_url: str | None
    is_saved: bool = False
    application_status: str | None = None  # if user already applied

    @field_validator("preferred_skills", mode="before")
    @classmethod
    def parse_preferred_skills(cls, v):
        return _parse_json_list(v)

    model_config = {"from_attributes": True}


class JobSwipeAction(BaseModel):
    job_id: uuid.UUID
    action: str  # liked|disliked|saved


class JobMatchResponse(BaseModel):
    jobs: list[JobListingResponse]
    total: int
    page: int
    page_size: int
