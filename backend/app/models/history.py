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
    performed_by_user = relationship("User", foreign_keys=[performed_by_user_id], viewonly=True)

    @property
    def performed_by_profile_picture(self) -> str | None:
        # Snapshot fields (performed_by_username) survive user deletion —
        # this live relationship doesn't, so it's None once the user is
        # deleted (see crud/user.py::delete_user, which nulls this FK).
        return self.performed_by_user.profile_picture if self.performed_by_user else None