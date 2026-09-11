from typing import Optional
from sqlalchemy.orm import Session

from app.models.case_lock import CaseLock


def get_lock(db: Session, case_id: int) -> Optional[CaseLock]:
    return db.query(CaseLock).filter(CaseLock.case_id == case_id).first()


def create_lock(db: Session, case_id: int, user_id: int, username: str) -> CaseLock:
    lock = CaseLock(case_id=case_id, user_id=user_id, username=username)
    db.add(lock)
    db.flush()
    return lock


def touch_heartbeat(db: Session, lock: CaseLock) -> CaseLock:
    # Reassigning to itself is enough to mark the row dirty so SQLAlchemy
    # emits the UPDATE and applies the column's onupdate=func.now().
    lock.username = lock.username
    db.flush()
    return lock


def delete_lock(db: Session, case_id: int) -> None:
    db.query(CaseLock).filter(CaseLock.case_id == case_id).delete()
    db.flush()