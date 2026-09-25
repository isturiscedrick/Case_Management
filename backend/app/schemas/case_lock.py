from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.base import as_utc


class CaseLockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    user_id: int
    username: str
    locked_at: Optional[datetime] = None
    last_heartbeat_at: Optional[datetime] = None

    @field_validator("locked_at", "last_heartbeat_at", mode="before")
    @classmethod
    def _tag_utc(cls, value):
        return as_utc(value)