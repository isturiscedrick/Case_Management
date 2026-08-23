from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.case import Case, CaseComplainant, CaseCause


def get_case(db: Session, case_id: int) -> Optional[Case]:
    return db.query(Case).filter(Case.case_id == case_id).first()


def get_case_by_case_no(db: Session, case_no: str) -> Optional[Case]:
    return db.query(Case).filter(Case.case_no == case_no).first()


def list_cases(
    db: Session, *, search: Optional[str] = None, status: Optional[str] = None,
    company: Optional[str] = None, archived: bool = False, page: int = 1, page_size: int = 25,
) -> List[Case]:
    query = db.query(Case).filter(Case.archived == archived)

    if status:
        query = query.filter(Case.current_status == status)
    if company:
        query = query.filter(Case.company_name == company)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Case.company_name.ilike(like), Case.case_no.ilike(like)))

    return query.order_by(Case.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()


def create_case(db: Session, **fields) -> Case:
    case = Case(**fields)
    db.add(case)
    db.flush()
    return case


def update_case_fields(db: Session, case: Case, **fields) -> Case:
    for key, value in fields.items():
        setattr(case, key, value)
    db.flush()
    return case


def link_complainant(db: Session, case_id: int, complainant_id: int) -> None:
    db.add(CaseComplainant(case_id=case_id, complainant_id=complainant_id))


def link_cause(db: Session, case_id: int, cause_of_action_id: int) -> None:
    db.add(CaseCause(case_id=case_id, cause_of_action_id=cause_of_action_id))


def clear_complainant_links(db: Session, case_id: int) -> None:
    db.query(CaseComplainant).filter(CaseComplainant.case_id == case_id).delete()


def clear_cause_links(db: Session, case_id: int) -> None:
    db.query(CaseCause).filter(CaseCause.case_id == case_id).delete()