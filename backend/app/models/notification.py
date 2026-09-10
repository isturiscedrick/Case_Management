from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    notification_type = Column(String(50), nullable=False)
    message = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], viewonly=True)

    @property
    def user_profile_picture(self) -> str | None:
        return self.user.profile_picture if self.user else None

    @property
    def user_full_name(self) -> str | None:
        return self.user.full_name if self.user else None