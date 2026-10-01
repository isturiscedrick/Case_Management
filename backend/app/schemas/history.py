import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import CaseHistoryAction
from app.schemas.base import as_utc


class FieldChange(BaseModel):
    field: str
    before: str = ""
    after: str = ""


def parse_changes(value):
    """The DB stores changes as a JSON string; the API returns a real list."""
    if value is None or isinstance(value, list):
        return value
    if isinstance(value, str):
        if not value.strip():
            return None
        try:
            return json.loads(value)
        except ValueError:
            return None
    return value


class CaseHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    history_id: int
    case_id: int
    case_no: str
    company: str
    action: CaseHistoryAction
    performed_by_username: Optional[str]
    performed_by_profile_picture: Optional[str] = None
    detail: Optional[str]
    changes: Optional[List[FieldChange]] = None
    created_at: Optional[datetime]

    @field_validator("created_at", mode="before")
    @classmethod
    def _tag_utc(cls, value):
        return as_utc(value)

    @field_validator("changes", mode="before")
    @classmethod
    def _parse_changes(cls, value):
        return parse_changes(value)