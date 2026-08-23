from sqlalchemy.orm import Session

from app.models.reference import CompanyReference, Complainant, CauseOfAction


def get_or_create_company(db: Session, company_name: str) -> CompanyReference:
    company = db.query(CompanyReference).filter(CompanyReference.company_name == company_name).first()
    if company:
        return company
    company = CompanyReference(company_name=company_name)
    db.add(company)
    db.flush()
    return company


def get_or_create_complainant(db: Session, name: str) -> Complainant:
    complainant = db.query(Complainant).filter(Complainant.complainant_name == name).first()
    if complainant:
        return complainant
    complainant = Complainant(complainant_name=name)
    db.add(complainant)
    db.flush()
    return complainant


def get_or_create_cause(db: Session, cause_name: str) -> CauseOfAction:
    cause = db.query(CauseOfAction).filter(CauseOfAction.cause_of_action == cause_name).first()
    if cause:
        return cause
    cause = CauseOfAction(cause_of_action=cause_name)
    db.add(cause)
    db.flush()
    return cause