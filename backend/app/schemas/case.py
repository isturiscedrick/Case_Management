from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import CaseStatus, StageProgress, TotalPaidCategory
from app.schemas.decision import DecisionIn, DecisionOut


class CaseStagePayload(BaseModel):
    company: str
    status: CaseStatus
    case_title: str
    case_no: str
    complainants: List[str]
    venue: str

    handling_personnel: Optional[str] = None
    handling_personnel_specification: Optional[str] = None

    cause: List[str] = []
    cause_specification: Optional[str] = None

    filing_date: Optional[date] = None

    remarks: Optional[StageProgress] = None
    remark_specification: Optional[str] = None

    la: Optional[DecisionIn] = None
    nlrc: Optional[DecisionIn] = None
    ca: Optional[DecisionIn] = None
    sc: Optional[DecisionIn] = None

    total_paid_category: Optional[TotalPaidCategory] = None

    @field_validator("complainants")
    @classmethod
    def at_least_one_complainant(cls, v: List[str]) -> List[str]:
        if not v or all(not c.strip() for c in v):
            raise ValueError("At least one complainant is required.")
        return v


class CaseCreate(CaseStagePayload):
    pass


class CaseUpdate(CaseStagePayload):
    pass


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: int
    company_name: str
    current_status: CaseStatus
    case_title: str
    case_no: str
    venue: Optional[str]
    handling_personnel: Optional[str]
    handling_personnel_specification: Optional[str]
    cause_specification: Optional[str]
    filing_date: Optional[date]
    remarks: Optional[StageProgress]
    remark_specification: Optional[str]
    total_paid_amount: Optional[Decimal]
    total_paid_category: Optional[TotalPaidCategory]
    closed: bool
    closed_date: Optional[date]
    created_by_username: Optional[str]
    created_at: Optional[datetime]
    updated_by_username: Optional[str]
    updated_at: Optional[datetime]
    archived: bool

    complainants: List[str] = []
    causes: List[str] = []
    decisions: List[DecisionOut] = []


class CaseListParams(BaseModel):
    search: Optional[str] = None
    status: Optional[str] = None
    company: Optional[str] = None
    archived: bool = False
    page: int = 1
    page_size: int = 25