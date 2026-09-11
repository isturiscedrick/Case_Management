from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func

from app.core.database import Base


class CaseLock(Base):
    """
    At most one row per case_id — the case is locked for editing by
    exactly one user at a time. A lock is considered stale (and safely
    reclaimable) once last_heartbeat_at is older than the timeout the
    service layer enforces (60s, matching the frontend's ~20s heartbeat
    interval). Row is deleted outright on explicit release (Cancel/Save)
    or when a new user reclaims a stale lock.
    """
    __tablename__ = "case_locks"

    case_id = Column(BigInteger, ForeignKey("cases.case_id"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    username = Column(String(150), nullable=False)
    locked_at = Column(DateTime, server_default=func.now())
    last_heartbeat_at = Column(DateTime, server_default=func.now(), onupdate=func.now())