from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.base import as_utc
from app.schemas.history import FieldChange, parse_changes


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    user_id: int
    notification_type: str
    message: str
    status: str
    user_full_name: Optional[str] = None
    user_profile_picture: Optional[str] = None
    # + NEW — who performed the action (e.g. who updated the case), for
    # notification_type == "case_update". Falls back to None for
    # notification types with no distinct actor.
    actor_full_name: Optional[str] = None
    actor_profile_picture: Optional[str] = None
    # + NEW — filled from the linked history row (case_update only).
    case_no: Optional[str] = None
    company: Optional[str] = None
    changes: Optional[List[FieldChange]] = None
    created_at: datetime | None = None
    resolved_at: datetime | None = None

    @field_validator("created_at", "resolved_at", mode="before")
    @classmethod
    def _tag_utc(cls, value):
        return as_utc(value)

    @field_validator("changes", mode="before")
    @classmethod
    def _parse_changes(cls, value):
        return parse_changes(value)