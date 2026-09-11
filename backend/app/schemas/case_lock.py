from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CaseLockOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    user_id: int
    username: str
    locked_at: Optional[datetime] = None
    last_heartbeat_at: Optional[datetime] = None