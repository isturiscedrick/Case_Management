from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    user_id: int
    notification_type: str
    message: str
    status: str
    user_full_name: Optional[str] = None
    user_profile_picture: Optional[str] = None
    created_at: datetime | None = None
    resolved_at: datetime | None = None