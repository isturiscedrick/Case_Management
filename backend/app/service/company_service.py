from typing import List
from sqlalchemy.orm import Session

from app.crud import reference as reference_crud
from app.models.reference import CompanyReference


def list_companies(db: Session) -> List[CompanyReference]:
    return reference_crud.list_companies(db)