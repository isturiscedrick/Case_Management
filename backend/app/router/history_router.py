from typing import Optional, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.history import CaseHistoryOut
from app.service import history_service
from app.service.deps import get_current_user
from app.models.enums import CaseHistoryAction

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=List[CaseHistoryOut])
def list_history(
    search: Optional[str] = None,
    action: Optional[CaseHistoryAction] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    return history_service.get_history(db, search=search, action=action, page=page, page_size=page_size)