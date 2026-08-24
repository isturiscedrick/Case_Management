from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.case import CaseCreate, CaseUpdate, CaseOut, CaseListParams
from app.service import case_service
from app.service.deps import get_current_user, require_role
from app.models.enums import UserRole

router = APIRouter(prefix="/api/cases", tags=["cases"])

# Viewer role is read-only across the whole case workflow — anything that
# creates, edits, closes, or archives a case requires admin or handling
# personnel, matching the ERD's forward-looking role note.
CAN_WRITE = require_role(UserRole.admin, UserRole.handling_personnel)
# Closing/unclosing a case is the sole hard lock mechanism (see CaseForm.tsx
# "Close Case"), so it's restricted further to admin only.
CAN_CLOSE = require_role(UserRole.admin)


@router.get("", response_model=List[CaseOut])
def list_cases(
    search: Optional[str] = None,
    status: Optional[str] = None,
    company: Optional[str] = None,
    archived: bool = False,
    page: int = 1,
    page_size: int = 25,
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    params = CaseListParams(search=search, status=status, company=company, archived=archived, page=page, page_size=page_size)
    return case_service.list_cases(db, params)


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), _current_user=Depends(get_current_user)):
    return case_service.get_case_or_404(db, case_id)


@router.post("", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(get_db), current_user=Depends(CAN_WRITE)):
    return case_service.create_case(db, payload, current_user)


@router.put("/{case_id}", response_model=CaseOut)
def update_case(case_id: int, payload: CaseUpdate, db: Session = Depends(get_db), current_user=Depends(CAN_WRITE)):
    return case_service.update_case(db, case_id, payload, current_user)


@router.post("/{case_id}/toggle-archive", response_model=CaseOut)
def toggle_archive(case_id: int, db: Session = Depends(get_db), current_user=Depends(CAN_WRITE)):
    return case_service.toggle_archive(db, case_id, current_user)


@router.post("/{case_id}/close", response_model=CaseOut)
def close_case(case_id: int, db: Session = Depends(get_db), current_user=Depends(CAN_CLOSE)):
    return case_service.close_case(db, case_id, current_user)


@router.post("/{case_id}/unclose", response_model=CaseOut)
def unclose_case(case_id: int, db: Session = Depends(get_db), current_user=Depends(CAN_CLOSE)):
    return case_service.unclose_case(db, case_id, current_user)