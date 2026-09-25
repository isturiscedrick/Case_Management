from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import CaseHistoryAction
from app.schemas.base import as_utc


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
    created_at: Optional[datetime]

    @field_validator("created_at", mode="before")
    @classmethod
    def _tag_utc(cls, value):
        return as_utc(value)