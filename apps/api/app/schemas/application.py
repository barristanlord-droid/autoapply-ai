import json
from datetime import datetime

from pydantic import BaseModel, field_validator


def _parse_json_dict(v):
    """Parse a JSON string to a dict, or return as-is if already a dict."""
    if v is None:
        return None
    if isinstance(v, dict):
        return v
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            return parsed if isinstance(parsed, dict) else None
        except (json.JSONDecodeError, TypeError):
            return None
    return None


class ApplicationCreate(BaseModel):
    job_id: str
    auto_generate_materials: bool = True
    cover_letter_tone: str = "professional"


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    status: str
    match_score: float | None
    submitted_at: datetime | None
    submission_method: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    # Nested
    job_title: str | None = None
    company_name: str | None = None

    model_config = {"from_attributes": True}


class ApplicationStatusUpdate(BaseModel):
    status: str
    note: str | None = None


class CoverLetterResponse(BaseModel):
    id: str
    content: str
    tone: str
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CoverLetterGenerate(BaseModel):
    job_id: str
    tone: str = "professional"
    custom_instructions: str | None = None


class TailoredResumeResponse(BaseModel):
    id: str
    content: str
    file_url: str | None
    modifications: dict | None = None
    created_at: datetime

    @field_validator("modifications", mode="before")
    @classmethod
    def parse_modifications(cls, v):
        return _parse_json_dict(v)

    model_config = {"from_attributes": True}


class ApplicationDetailResponse(ApplicationResponse):
    """Rich application detail with nested materials and timeline."""
    cover_letter: CoverLetterResponse | None = None
    tailored_resume: TailoredResumeResponse | None = None
    status_history: list[dict] = []

    @field_validator("status_history", mode="before")
    @classmethod
    def parse_status_history(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    # Extra job info for the detail view
    job_location: str | None = None
    job_is_remote: bool | None = None
    job_salary_min: float | None = None
    job_salary_max: float | None = None
    job_salary_currency: str | None = None
    job_type: str | None = None
    job_apply_url: str | None = None


class AutoApplyRequest(BaseModel):
    job_ids: list[str]
    generate_cover_letters: bool = True
    cover_letter_tone: str = "professional"


class AutoApplyResponse(BaseModel):
    queued: int
    credits_remaining: int | dict[str, int]
    applications: list[ApplicationResponse]


class DashboardStats(BaseModel):
    total_applications: int
    applications_this_week: int
    interview_rate: float
    response_rate: float
    status_breakdown: dict[str, int]  # {applied: 10, interview: 3, etc.}
    credits_remaining: dict[str, int]
    top_matching_score: float | None
