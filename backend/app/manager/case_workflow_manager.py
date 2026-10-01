import json
from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Optional
from sqlalchemy.orm import Session

from app.crud import case as case_crud
from app.crud import decision as decision_crud
from app.crud import reference as reference_crud
from app.crud import history as history_crud
from app.models.enums import DecisionLevel, CaseHistoryAction, JudgmentAwardMode
from app.models.case import Case
from app.schemas.case import CaseStagePayload

STAGE_LEVEL_MAP = {
    "la": DecisionLevel.labor_arbiter,
    "nlrc": DecisionLevel.national_labor_relations_commission,
    "ca": DecisionLevel.court_of_appeals,
    "sc": DecisionLevel.supreme_court,
}

STAGE_LABELS = {"la": "LA", "nlrc": "NLRC", "ca": "CA", "sc": "SC"}

CATEGORY_LABELS = {
    "Judgment-Award-W": "Judgment (In Favor)",
    "Judgment-Award-L": "Judgment (Not In Favor)",
    "Settlement": "Settlement",
}

# Mirrors getTotalJudgmentAward() in caseHelpers.ts: latest stage wins,
# checked SC -> CA -> NLRC -> LA, first one with an amount set.
_TOTAL_AWARD_STAGE_ORDER = ("sc", "ca", "nlrc", "la")


def _compute_total_paid_amount(payload: CaseStagePayload):
    for stage_key in _TOTAL_AWARD_STAGE_ORDER:
        stage = getattr(payload, stage_key)
        if stage is not None and stage.judgment_award_amount is not None:
            return stage.judgment_award_amount
    return None


# ---------------------------------------------------------------------
# Change tracking — builds the before/after comparison stored on
# case_history.changes and shown when an entry is double-clicked.
# ---------------------------------------------------------------------

def _text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, Enum):
        return str(value.value)
    if isinstance(value, Decimal):
        return f"₱{value:,.2f}"
    if isinstance(value, date):
        return value.isoformat()
    return str(value).strip()


def _snapshot_case(case: Case) -> dict[str, str]:
    """Flat label -> display-string view of a case. Insertion order is the
    order fields appear in the comparison (SEnA first, then each stage).
    Values are copied to plain strings so later edits can't mutate them."""
    category = _text(case.total_paid_category)

    snap: dict[str, str] = {
        "Company": _text(case.company_name),
        "Status": _text(case.current_status),
        "Case Title": _text(case.case_title),
        "Case No.": _text(case.case_no),
        "Complainants": ", ".join(sorted(case.complainants)),
        "Venue": _text(case.venue),
        "Handling Personnel": _text(case.handling_personnel),
        "Handling Personnel (specified)": _text(case.handling_personnel_specification),
        "Cause of Action": ", ".join(sorted(case.causes)),
        "Cause of Action (specified)": _text(case.cause_specification),
        "Filing Date": _text(case.filing_date),
        "SEnA Remarks": _text(case.remarks),
        "SEnA Remarks (specified)": _text(case.remark_specification),
    }

    by_level = {decision.level: decision for decision in case.decisions}

    for stage_key, level in STAGE_LEVEL_MAP.items():
        label = STAGE_LABELS[stage_key]
        decision = by_level.get(level)

        if decision is None:
            snap[f"{label} Date"] = ""
            snap[f"{label} Status"] = ""
            snap[f"{label} Judgment Award"] = ""
            snap[f"{label} Judgment Award (basis)"] = ""
            snap[f"{label} Remarks"] = ""
            snap[f"{label} Remarks (specified)"] = ""
            snap[f"{label} Progress"] = ""
            snap[f"{label} Progress (specified)"] = ""
            continue

        is_computed = decision.judgment_award_mode == JudgmentAwardMode.to_be_computed

        snap[f"{label} Date"] = _text(decision.date)
        snap[f"{label} Status"] = _text(decision.status)
        snap[f"{label} Judgment Award"] = (
            "To be computed" if is_computed else _text(decision.judgment_award_amount)
        )
        snap[f"{label} Judgment Award (basis)"] = _text(
            decision.judgment_award_computed_specification
            if is_computed
            else decision.judgment_award_amount_specification
        )
        snap[f"{label} Remarks"] = _text(decision.remarks)
        snap[f"{label} Remarks (specified)"] = _text(decision.remarks_specification)
        snap[f"{label} Progress"] = _text(decision.progress)
        snap[f"{label} Progress (specified)"] = _text(decision.progress_specification)

    snap["Total Judgment Award"] = _text(case.total_paid_amount)
    snap["Category"] = CATEGORY_LABELS.get(category, category)

    return snap


def _diff(before: dict[str, str], after: dict[str, str]) -> list[dict[str, str]]:
    changes = []
    for field, new_value in after.items():
        old_value = before.get(field, "")
        if old_value != new_value:
            changes.append({"field": field, "before": old_value, "after": new_value})
    return changes


def _serialize_changes(changes: list[dict[str, str]]) -> Optional[str]:
    return json.dumps(changes, ensure_ascii=False) if changes else None


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
            total_paid_amount=_compute_total_paid_amount(payload),
            total_paid_category=payload.total_paid_category,
            created_by_user_id=created_by_user_id,
            created_by_username=created_by_username,
        )

        _sync_complainants(db, case.case_id, payload.complainants)
        _sync_causes(db, case.case_id, payload.cause)

        for stage_key in ("la", "nlrc", "ca", "sc"):
            _upsert_stage(db, case.case_id, stage_key, getattr(payload, stage_key))

        # A new case "changes" every non-empty field from blank to its value.
        db.flush()
        db.refresh(case)
        after = _snapshot_case(case)
        created_changes = _diff({key: "" for key in after}, after)

        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.created,
            performed_by_user_id=created_by_user_id, performed_by_username=created_by_username,
            changes=_serialize_changes(created_changes),
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
) -> tuple[Case, int]:
    """Returns (case, history_id) — history_id is the case_history row for
    this update, so the caller can link a notification to its comparison."""
    try:
        # Snapshot BEFORE anything is written.
        before = _snapshot_case(case)

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
            total_paid_amount=_compute_total_paid_amount(payload),
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

        # Snapshot AFTER all writes (including stage resets). flush + refresh
        # forces the relationships (complainants, causes, decisions) to be
        # re-read from the DB instead of using stale loaded collections.
        db.flush()
        db.refresh(case)
        after = _snapshot_case(case)
        changes = _diff(before, after)

        entry = history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.updated,
            performed_by_user_id=updated_by_user_id, performed_by_username=updated_by_username,
            detail="Case details updated.",
            changes=_serialize_changes(changes),
        )
        history_id = entry.history_id

        db.commit()
        db.refresh(case)
        return case, history_id
    except Exception:
        db.rollback()
        raise


def toggle_archive(
    db: Session, case: Case, *,
    performed_by_user_id: Optional[int], performed_by_username: Optional[str],
) -> Case:
    try:
        was_archived = bool(case.archived)
        case.archived = not case.archived
        db.flush()

        action = CaseHistoryAction.archived if case.archived else CaseHistoryAction.restored
        changes = _diff(
            {"Archived": "Yes" if was_archived else "No"},
            {"Archived": "Yes" if case.archived else "No"},
        )
        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=action,
            performed_by_user_id=performed_by_user_id, performed_by_username=performed_by_username,
            changes=_serialize_changes(changes),
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
        was_closed = bool(case.closed)
        old_closed_date = case.closed_date

        case.closed = closed
        case.closed_date = date.today() if closed else None
        db.flush()

        changes = _diff(
            {
                "Case Closed": "Yes" if was_closed else "No",
                "Closed Date": _text(old_closed_date),
            },
            {
                "Case Closed": "Yes" if closed else "No",
                "Closed Date": _text(case.closed_date),
            },
        )

        history_crud.create_history_entry(
            db, case_id=case.case_id, case_no=case.case_no, company=case.company_name,
            action=CaseHistoryAction.updated,
            performed_by_user_id=performed_by_user_id, performed_by_username=performed_by_username,
            detail="Case closed." if closed else "Case reopened (unclosed).",
            changes=_serialize_changes(changes),
        )

        db.commit()
        db.refresh(case)
        return case
    except Exception:
        db.rollback()
        raise