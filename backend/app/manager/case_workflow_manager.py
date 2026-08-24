from datetime import date
from typing import Optional
from sqlalchemy.orm import Session

from app.crud import case as case_crud
from app.crud import decision as decision_crud
from app.crud import reference as reference_crud
from app.crud import history as history_crud
from app.models.enums import DecisionLevel, CaseHistoryAction
from app.models.case import Case
from app.schemas.case import CaseStagePayload

STAGE_LEVEL_MAP = {
    "la": DecisionLevel.labor_arbiter,
    "nlrc": DecisionLevel.national_labor_relations_commission,
    "ca": DecisionLevel.court_of_appeals,
    "sc": DecisionLevel.supreme_court,
}


def _sync_complainants(db: Session, case_id: int, names: list[str]) -> None:
    case_crud.clear_complainant_links(db, case_id)
    for name in names:
        if not name.strip():
            continue
        complainant = reference_crud.get_or_create_complainant(db, name.strip())
        case_crud.link_complainant(db, case_id, complainant.complainant_id)


def _sync_causes(db: Session, case_id: int, causes: list[str]) -> None:
    case_crud.clear_cause_links(db, case_id)
    for cause_name in causes:
        cause = reference_crud.get_or_create_cause(db, cause_name)
        case_crud.link_cause(db, case_id, cause.cause_of_action_id)


def _upsert_stage(db: Session, case_id: int, stage_key: str, payload) -> None:
    if payload is None:
        return
    level = STAGE_LEVEL_MAP[stage_key]
    # Full dump (not exclude_unset) so that fields the client leaves as
    # their default (None / cleared) actually overwrite stale DB values —
    # e.g. progress_specification must be nulled out when progress moves
    # off "Not Settled"/"Others", mirroring the frontend's explicit resets.
    fields = payload.model_dump()
    decision_crud.upsert_decision(db, case_id, level, **fields)


def create_case(
    db: Session, payload: CaseStagePayload, *,
    created_by_user_id: Optional[int], created_by_username: Optional[str],
) -> Case:
    try:
        company = reference_crud.get_or_create_company(db, payload.company)

        case = case_crud.create_case(
            db,
            company_id=company.company_id,
            company_name=payload.company,
            current_status=payload.status,
            last_status_update=date.today(),
            case_title=payload.case_title,
            case_no=payload.case_no,
            venue=payload.venue,
            handling_personnel=payload.handling_personnel,
            handling_personnel_specification=payload.handling_personnel_specification,
            cause_specification=payload.cause_specification,
            filing_date=payload.filing_date,
            remarks=payload.remarks,
            remark_specification=payload.remark_specification,
            total_paid_category=payload.total_paid_category,
            created_by_user_id=created_by_user_id,
            created_by_username=created_by_username,
        )

        _sync_complainants(db, case.case_id, payload.complainants)
        _sync_causes(db, case.case_id, payload.cause)

        for stage_key in ("la", "nlrc", "ca", "sc"):
            _upsert_stage(db, case.case_id, stage_key, getattr(payload, stage_key))

        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.created,
            performed_by_user_id=created_by_user_id, performed_by_username=created_by_username,
        )

        db.commit()
        db.refresh(case)
        return case
    except Exception:
        db.rollback()
        raise


def update_case(
    db: Session, case: Case, payload: CaseStagePayload, *,
    updated_by_user_id: Optional[int], updated_by_username: Optional[str],
    reset_stages: Optional[list[str]] = None,
) -> Case:
    try:
        company = reference_crud.get_or_create_company(db, payload.company)

        case_crud.update_case_fields(
            db, case,
            company_id=company.company_id,
            company_name=payload.company,
            current_status=payload.status,
            last_status_update=date.today(),
            case_title=payload.case_title,
            case_no=payload.case_no,
            venue=payload.venue,
            handling_personnel=payload.handling_personnel,
            handling_personnel_specification=payload.handling_personnel_specification,
            cause_specification=payload.cause_specification,
            filing_date=payload.filing_date,
            remarks=payload.remarks,
            remark_specification=payload.remark_specification,
            total_paid_category=payload.total_paid_category,
            updated_by_user_id=updated_by_user_id,
            updated_by_username=updated_by_username,
        )

        _sync_complainants(db, case.case_id, payload.complainants)
        _sync_causes(db, case.case_id, payload.cause)

        for stage_key in ("la", "nlrc", "ca", "sc"):
            _upsert_stage(db, case.case_id, stage_key, getattr(payload, stage_key))

        for stage_key in reset_stages or []:
            decision_crud.clear_decision(db, case.case_id, STAGE_LEVEL_MAP[stage_key])

        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.updated,
            performed_by_user_id=updated_by_user_id, performed_by_username=updated_by_username,
            detail="Case details updated.",
        )

        db.commit()
        db.refresh(case)
        return case
    except Exception:
        db.rollback()
        raise


def toggle_archive(
    db: Session, case: Case, *,
    performed_by_user_id: Optional[int], performed_by_username: Optional[str],
) -> Case:
    try:
        case.archived = not case.archived
        db.flush()

        action = CaseHistoryAction.archived if case.archived else CaseHistoryAction.restored
        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=action,
            performed_by_user_id=performed_by_user_id, performed_by_username=performed_by_username,
        )

        db.commit()
        db.refresh(case)
        return case
    except Exception:
        db.rollback()
        raise


def set_closed(
    db: Session, case: Case, *, closed: bool,
    performed_by_user_id: Optional[int], performed_by_username: Optional[str],
) -> Case:
    try:
        case.closed = closed
        case.closed_date = date.today() if closed else None
        db.flush()

        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.updated,
            performed_by_user_id=performed_by_user_id, performed_by_username=performed_by_username,
            detail="Case closed." if closed else "Case reopened (unclosed).",
        )

        db.commit()
        db.refresh(case)
        return case
    except Exception:
        db.rollback()
        raise