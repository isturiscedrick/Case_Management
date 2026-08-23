from sqlalchemy import (
    Column, BigInteger, String, Date, DateTime, Boolean, Numeric,
    ForeignKey, Enum as SAEnum, func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import CaseStatus, StageProgress, TotalPaidCategory


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(BigInteger, primary_key=True, autoincrement=True)

    company_id = Column(BigInteger, ForeignKey("companies_reference.company_id"), nullable=True)
    company_name = Column(String(255), nullable=False)

    current_status = Column(SAEnum(CaseStatus), nullable=False, default=CaseStatus.Pending)
    last_status_update = Column(Date, nullable=True)

    case_title = Column(String(255), nullable=False)
    case_no = Column(String(100), nullable=False, unique=True, index=True)
    venue = Column(String(255), nullable=True)

    handling_personnel = Column(String(150), nullable=True)
    handling_personnel_specification = Column(String(255), nullable=True)

    cause_specification = Column(String(255), nullable=True)
    filing_date = Column(Date, nullable=True)

    remarks = Column(SAEnum(StageProgress), nullable=True)
    remark_specification = Column(String(500), nullable=True)

    total_paid_amount = Column(Numeric(14, 2), nullable=True)
    total_paid_category = Column(SAEnum(TotalPaidCategory), nullable=True)

    closed = Column(Boolean, nullable=False, default=False)
    closed_date = Column(Date, nullable=True)

    created_by_user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=True)
    created_by_username = Column(String(150), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    updated_by_user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=True)
    updated_by_username = Column(String(150), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    archived = Column(Boolean, nullable=False, default=False)

    decisions = relationship("Decision", back_populates="case", cascade="all, delete-orphan")
    complainant_links = relationship("CaseComplainant", back_populates="case", cascade="all, delete-orphan")
    cause_links = relationship("CaseCause", back_populates="case", cascade="all, delete-orphan")
    history_entries = relationship("CaseHistory", back_populates="case", cascade="all, delete-orphan")


class CaseComplainant(Base):
    __tablename__ = "case_complainants"

    case_id = Column(BigInteger, ForeignKey("cases.case_id"), primary_key=True)
    complainant_id = Column(BigInteger, ForeignKey("complainants.complainant_id"), primary_key=True)

    case = relationship("Case", back_populates="complainant_links")
    complainant = relationship("Complainant")


class CaseCause(Base):
    __tablename__ = "case_causes"

    case_id = Column(BigInteger, ForeignKey("cases.case_id"), primary_key=True)
    cause_of_action_id = Column(BigInteger, ForeignKey("cause_of_actions.cause_of_action_id"), primary_key=True)

    case = relationship("Case", back_populates="cause_links")
    cause_of_action = relationship("CauseOfAction")