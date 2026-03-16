import json
from datetime import datetime

from pydantic import BaseModel, field_validator


def _parse_json_dict(v):
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


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    data: dict | None = None
    is_read: bool
    read_at: datetime | None
    created_at: datetime

    @field_validator("data", mode="before")
    @classmethod
    def parse_data(cls, v):
        return _parse_json_dict(v)

    model_config = {"from_attributes": True}


class NotificationCount(BaseModel):
    total: int
    unread: int
