from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.history import CaseHistory
from app.models.enums import CaseHistoryAction


def create_history_entry(
    db: Session, *, case_id: int, case_no: str, company: str, action: CaseHistoryAction,
    performed_by_user_id: Optional[int], performed_by_username: Optional[str],
    detail: Optional[str] = None,
) -> CaseHistory:
    entry = CaseHistory(
        case_id=case_id, case_no=case_no, company=company, action=action,
        performed_by_user_id=performed_by_user_id, performed_by_username=performed_by_username,
        detail=detail,
    )
    db.add(entry)
    db.flush()
    return entry


def list_history(
    db: Session, *, search: Optional[str] = None, action: Optional[CaseHistoryAction] = None,
    page: int = 1, page_size: int = 50,
) -> List[CaseHistory]:
    query = db.query(CaseHistory)
    if action:
        query = query.filter(CaseHistory.action == action)
    if search:
        like = f"%{search}%"
        query = query.filter((CaseHistory.company.ilike(like)) | (CaseHistory.case_no.ilike(like)))
    return query.order_by(CaseHistory.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()