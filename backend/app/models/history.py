from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import CaseHistoryAction


class CaseHistory(Base):
    __tablename__ = "case_history"

    history_id = Column(BigInteger, primary_key=True, autoincrement=True)
    case_id = Column(BigInteger, ForeignKey("cases.case_id"), nullable=False)

    case_no = Column(String(100), nullable=False)
    company = Column(String(255), nullable=False)

    action = Column(SAEnum(CaseHistoryAction), nullable=False)

    performed_by_user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=True)
    performed_by_username = Column(String(150), nullable=True)

    detail = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="history_entries")