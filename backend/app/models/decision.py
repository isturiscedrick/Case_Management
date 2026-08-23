from sqlalchemy import (
    Column, BigInteger, String, Date, DateTime, Numeric,
    ForeignKey, UniqueConstraint, Enum as SAEnum, func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import (
    DecisionLevel, TribunalDecisionStatus, TribunalRemarks,
    JudgmentAwardMode, StageProgress,
)


class Decision(Base):
    __tablename__ = "decisions"
    __table_args__ = (UniqueConstraint("case_id", "level", name="uq_case_level"),)

    decision_id = Column(BigInteger, primary_key=True, autoincrement=True)
    case_id = Column(BigInteger, ForeignKey("cases.case_id"), nullable=False)

    level = Column(SAEnum(DecisionLevel), nullable=False)
    date = Column(Date, nullable=True)
    status = Column(SAEnum(TribunalDecisionStatus), nullable=True)

    judgment_award_mode = Column(SAEnum(JudgmentAwardMode), nullable=True)
    judgment_award_amount = Column(Numeric(14, 2), nullable=True)
    judgment_award_amount_specification = Column(String(500), nullable=True)
    judgment_award_computed_specification = Column(String(500), nullable=True)

    remarks = Column(SAEnum(TribunalRemarks), nullable=True)
    remarks_specification = Column(String(500), nullable=True)

    progress = Column(SAEnum(StageProgress), nullable=True)
    progress_specification = Column(String(500), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    case = relationship("Case", back_populates="decisions")