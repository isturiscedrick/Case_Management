from typing import Optional
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.enums import DecisionLevel


def get_decision(db: Session, case_id: int, level: DecisionLevel) -> Optional[Decision]:
    return db.query(Decision).filter(Decision.case_id == case_id, Decision.level == level).first()


def upsert_decision(db: Session, case_id: int, level: DecisionLevel, **fields) -> Decision:
    decision = get_decision(db, case_id, level)
    if decision:
        for key, value in fields.items():
            setattr(decision, key, value)
    else:
        decision = Decision(case_id=case_id, level=level, **fields)
        db.add(decision)
    db.flush()
    return decision


def get_decision_as_stage_dict(db: Session, case_id: int, level: DecisionLevel) -> Optional[dict]:
    decision = get_decision(db, case_id, level)
    if not decision:
        return None
    return {
        "date": decision.date,
        "status": decision.status,
        "judgment_award_mode": decision.judgment_award_mode,
        "judgment_award_amount": decision.judgment_award_amount,
        "judgment_award_amount_specification": decision.judgment_award_amount_specification,
        "judgment_award_computed_specification": decision.judgment_award_computed_specification,
        "remarks": decision.remarks,
        "remarks_specification": decision.remarks_specification,
        "progress": decision.progress,
        "progress_specification": decision.progress_specification,
    }


def decision_has_data(db: Session, case_id: int, level: DecisionLevel) -> bool:
    decision = get_decision(db, case_id, level)
    if not decision:
        return False
    return any([
        decision.date is not None,
        decision.status is not None,
        decision.judgment_award_amount is not None,
        (decision.judgment_award_amount_specification or "").strip() != "",
        (decision.judgment_award_computed_specification or "").strip() != "",
        decision.remarks is not None,
        (decision.remarks_specification or "").strip() != "",
        decision.progress is not None,
        (decision.progress_specification or "").strip() != "",
    ])


def clear_decision(db: Session, case_id: int, level: DecisionLevel) -> None:
    decision = get_decision(db, case_id, level)
    if not decision:
        return
    decision.date = None
    decision.status = None
    decision.judgment_award_mode = None
    decision.judgment_award_amount = None
    decision.judgment_award_amount_specification = None
    decision.judgment_award_computed_specification = None
    decision.remarks = None
    decision.remarks_specification = None
    decision.progress = None
    decision.progress_specification = None
    db.flush()