from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud import case as case_crud
from app.crud import decision as decision_crud
from app.manager import case_workflow_manager
from app.manager.case_workflow_manager import STAGE_LEVEL_MAP
from app.schemas.case import CaseCreate, CaseUpdate, CaseListParams
from app.service.case_validation_service import validate_case_payload, determine_reset_stages
from app.models.case import Case
from app.models.user import User


def get_case_or_404(db: Session, case_id: int) -> Case:
    case = case_crud.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")
    return case


def list_cases(db: Session, params: CaseListParams) -> List[Case]:
    return case_crud.list_cases(
        db, search=params.search, status=params.status, company=params.company,
        archived=params.archived, page=params.page, page_size=params.page_size,
    )


def create_case(db: Session, payload: CaseCreate, current_user: User) -> Case:
    validate_case_payload(payload)

    # Pre-check is a fast-path UX nicety, not the source of truth — a
    # concurrent request can still slip past it, so the actual guarantee
    # comes from catching the DB's unique constraint below.
    existing = case_crud.get_case_by_case_no(db, payload.case_no)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f'Case No. "{payload.case_no}" already exists.')

    try:
        return case_workflow_manager.create_case(
            db, payload, created_by_user_id=current_user.user_id, created_by_username=current_user.full_name,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'Case No. "{payload.case_no}" already exists.',
        )

def update_case(db: Session, case_id: int, payload: CaseUpdate, current_user: User) -> Case:
    case = get_case_or_404(db, case_id)

    if case.closed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This case is closed and can no longer be updated.")

    validate_case_payload(payload)

    if payload.case_no != case.case_no:
        collision = case_crud.get_case_by_case_no(db, payload.case_no)
        if collision and collision.case_id != case_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f'Case No. "{payload.case_no}" already exists.')

    db_has_data = {
        stage_key: decision_crud.decision_has_data(db, case_id, level)
        for stage_key, level in STAGE_LEVEL_MAP.items()
    }
    reset_stages = determine_reset_stages(payload, db_has_data=db_has_data)

    try:
        return case_workflow_manager.update_case(
            db, case, payload,
            updated_by_user_id=current_user.user_id, updated_by_username=current_user.full_name,
            reset_stages=reset_stages,
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'Case No. "{payload.case_no}" already exists.',
        )


def toggle_archive(db: Session, case_id: int, current_user: User) -> Case:
    case = get_case_or_404(db, case_id)
    return case_workflow_manager.toggle_archive(
        db, case, performed_by_user_id=current_user.user_id, performed_by_username=current_user.full_name,
    )


def close_case(db: Session, case_id: int, current_user: User) -> Case:
    case = get_case_or_404(db, case_id)
    if case.closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Case is already closed.")
    return case_workflow_manager.set_closed(
        db, case, closed=True, performed_by_user_id=current_user.user_id, performed_by_username=current_user.full_name,
    )


def unclose_case(db: Session, case_id: int, current_user: User) -> Case:
    case = get_case_or_404(db, case_id)
    if not case.closed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Case is not closed.")
    return case_workflow_manager.set_closed(
        db, case, closed=False, performed_by_user_id=current_user.user_id, performed_by_username=current_user.full_name,
    )