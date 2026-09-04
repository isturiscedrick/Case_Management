from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.company import CompanyOut
from app.service import company_service

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=List[CompanyOut])
def list_companies(db: Session = Depends(get_db)):
    return company_service.list_companies(db)