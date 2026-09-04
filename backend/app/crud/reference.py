from sqlalchemy.orm import Session

from app.models.reference import CompanyReference, Complainant, CauseOfAction


def get_or_create_company(
    db: Session,
    company_name: str,
    *,
    company_group: str | None = None,
    company_group2: str | None = None,
) -> CompanyReference:
    company = db.query(CompanyReference).filter(CompanyReference.company_name == company_name).first()
    if company:
        # Supervisor's list is authoritative for group data — keep it in
        # sync on every seed run, but don't clobber groups with None when
        # this is called from case creation (which doesn't pass groups).
        if company_group is not None:
            company.company_group = company_group
        if company_group2 is not None:
            company.company_group2 = company_group2
        db.flush()
        return company
    company = CompanyReference(
        company_name=company_name,
        company_group=company_group,
        company_group2=company_group2,
    )
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