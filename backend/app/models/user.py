from sqlalchemy import Column, BigInteger, String, DateTime, Enum as SAEnum, func

from app.core.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.handling_personnel)
    is_active = Column(String(1), nullable=False, default="Y")
    created_at = Column(DateTime, server_default=func.now())