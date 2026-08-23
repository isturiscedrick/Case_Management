from typing import Optional, List
from sqlalchemy.orm import Session

from app.crud import history as history_crud
from app.models.history import CaseHistory
from app.models.enums import CaseHistoryAction


def get_history(
    db: Session, *, search: Optional[str] = None, action: Optional[CaseHistoryAction] = None,
    page: int = 1, page_size: int = 50,
) -> List[CaseHistory]:
    return history_crud.list_history(db, search=search, action=action, page=page, page_size=page_size)