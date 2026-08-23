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