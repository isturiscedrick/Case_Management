from typing import Optional
from fastapi import HTTPException, status

from app.models.enums import StageProgress
from app.schemas.case import CaseStagePayload
from app.schemas.decision import DecisionIn


def _stage_is_started(stage: Optional[DecisionIn]) -> bool:
    if stage is None:
        return False
    return any([
        stage.date is not None,
        stage.status is not None,
        stage.judgment_award_amount is not None,
        (stage.judgment_award_amount_specification or "").strip() != "",
        (stage.judgment_award_computed_specification or "").strip() != "",
        stage.remarks is not None,
        (stage.remarks_specification or "").strip() != "",
        stage.progress is not None,
        (stage.progress_specification or "").strip() != "",
    ])


def _stage_is_filled(stage: Optional[DecisionIn]) -> bool:
    if stage is None:
        return False

    is_computed = stage.judgment_award_amount is None and (
        stage.judgment_award_computed_specification or ""
    ).strip() != ""

    if is_computed:
        award_spec_filled = (stage.judgment_award_computed_specification or "").strip() != ""
    else:
        award_spec_filled = (stage.judgment_award_amount_specification or "").strip() != ""

    has_award = stage.judgment_award_amount is not None or is_computed

    remarks_ok = (
        stage.remarks is None
        or stage.remarks.value != "Other"
        or (stage.remarks_specification or "").strip() != ""
    )

    return bool(stage.date is not None and stage.status is not None and has_award and award_spec_filled and remarks_ok)


def _progress_specify_ok(stage: Optional[DecisionIn]) -> Optional[str]:
    if stage is None or stage.progress is None:
        return None
    if stage.progress in (StageProgress.Not_Settled, StageProgress.Others):
        if (stage.progress_specification or "").strip() == "":
            return 'Specify Progress is required when Progress is "Not Settled" or "Others".'
    return None


def validate_case_payload(payload: CaseStagePayload) -> None:
    errors: list[str] = []

    sena_filled = bool(
        payload.company.strip()
        and payload.case_title.strip()
        and payload.case_no.strip()
        and all(c.strip() for c in payload.complainants)
        and payload.venue.strip()
        and (payload.handling_personnel or "").strip() != ""
        and (payload.handling_personnel != "Others" or (payload.handling_personnel_specification or "").strip() != "")
        and len(payload.cause) > 0
        and ("Others" not in payload.cause or (payload.cause_specification or "").strip() != "")
        and payload.filing_date is not None
    )

    if not sena_filled:
        errors.append(
            "Complete all SEnA fields (Company, Status, Case Title, Case No., "
            "Complainants, Venue, Handling Personnel, Cause of Action, Filing Date)."
        )

    if payload.remarks in (StageProgress.Not_Settled, StageProgress.Others):
        if (payload.remark_specification or "").strip() == "":
            errors.append('Specify Remarks is required when SEnA Remarks is "Not Settled" or "Others".')

    stage_labels = {"la": "LA", "nlrc": "NLRC", "ca": "CA", "sc": "SC"}
    for key, label in stage_labels.items():
        stage = getattr(payload, key)
        if _stage_is_started(stage) and not _stage_is_filled(stage):
            errors.append(f"Complete all required {label} fields before saving.")

        progress_error = _progress_specify_ok(stage)
        if progress_error:
            errors.append(f"{label}: {progress_error}")

    any_settled = payload.remarks == StageProgress.Settled or any(
        getattr(payload, key) is not None and getattr(payload, key).progress == StageProgress.Settled
        for key in ("la", "nlrc", "ca", "sc")
    )
    if any_settled and not payload.total_paid_category:
        errors.append("Category is required when SEnA Remarks or any stage Progress is Settled.")

    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)


def determine_reset_stages(
    new_payload: CaseStagePayload,
    *,
    db_has_data: dict[str, bool],
) -> list[str]:
    """
    Decide which downstream stages must be cleared.

    db_has_data maps stage key -> whether that stage currently has any
    saved data in the DB (independent of what's in new_payload). A
    downstream stage is reset if EITHER the DB or the incoming payload
    has data for it, and the upstream stage's progress no longer allows
    proceeding — otherwise a partial payload that omits downstream data
    could leave stale rows behind unreset.
    """
    stage_order = ["la", "nlrc", "ca", "sc"]
    reset: list[str] = []

    for i, key in enumerate(stage_order[:-1]):
        stage = getattr(new_payload, key)
        downstream_key = stage_order[i + 1]
        downstream = getattr(new_payload, downstream_key)

        progress = stage.progress if stage else None
        moved_away = progress not in (StageProgress.Not_Settled, StageProgress.Others)

        downstream_has_data = _stage_is_started(downstream) or db_has_data.get(downstream_key, False)

        if downstream_has_data and moved_away:
            reset.append(downstream_key)

    return reset