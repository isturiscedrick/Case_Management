from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    DecisionLevel, TribunalDecisionStatus, TribunalRemarks,
    JudgmentAwardMode, StageProgress,
)


class DecisionBase(BaseModel):
    date: Optional[date] = None
    status: Optional[TribunalDecisionStatus] = None
    judgment_award_mode: Optional[JudgmentAwardMode] = None
    judgment_award_amount: Optional[Decimal] = None
    judgment_award_amount_specification: Optional[str] = None
    judgment_award_computed_specification: Optional[str] = None
    remarks: Optional[TribunalRemarks] = None
    remarks_specification: Optional[str] = None
    progress: Optional[StageProgress] = None
    progress_specification: Optional[str] = None


class DecisionIn(DecisionBase):
    pass


class DecisionOut(DecisionBase):
    model_config = ConfigDict(from_attributes=True)

    decision_id: int
    case_id: int
    level: DecisionLevel