from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import CaseHistoryAction


class CaseHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    history_id: int
    case_id: int
    case_no: str
    company: str
    action: CaseHistoryAction
    performed_by_username: Optional[str]
    detail: Optional[str]
    created_at: Optional[datetime]