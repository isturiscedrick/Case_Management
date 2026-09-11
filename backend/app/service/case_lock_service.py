from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import case_lock as case_lock_crud
from app.models.case_lock import CaseLock
from app.models.user import User

# Frontend heartbeats every ~20s (per product decision) — 60s gives it two
# missed beats of grace before another user can reclaim the lock.
LOCK_TIMEOUT_SECONDS = 60


def _naive_utcnow() -> datetime:
    # DB columns are naive DATETIME (server_default now()); compare naive-to-naive.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _is_stale(lock: CaseLock) -> bool:
    reference = lock.last_heartbeat_at or lock.locked_at
    if reference is None:
        return True
    return _naive_utcnow() - reference > timedelta(seconds=LOCK_TIMEOUT_SECONDS)


def _conflict(lock: CaseLock) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"This case is currently being edited by {lock.username}.",
    )


def acquire_lock(db: Session, case_id: int, current_user: User) -> CaseLock:
    existing = case_lock_crud.get_lock(db, case_id)

    if existing is None:
        lock = case_lock_crud.create_lock(db, case_id, current_user.user_id, current_user.full_name)
        db.commit()
        db.refresh(lock)
        return lock

    if existing.user_id == current_user.user_id:
        # Same user reopening (e.g. refresh) — just refresh the heartbeat.
        case_lock_crud.touch_heartbeat(db, existing)
        db.commit()
        db.refresh(existing)
        return existing

    if _is_stale(existing):
        case_lock_crud.delete_lock(db, case_id)
        lock = case_lock_crud.create_lock(db, case_id, current_user.user_id, current_user.full_name)
        db.commit()
        db.refresh(lock)
        return lock

    raise _conflict(existing)


def heartbeat(db: Session, case_id: int, current_user: User) -> CaseLock:
    existing = case_lock_crud.get_lock(db, case_id)

    if existing is None or existing.user_id != current_user.user_id:
        # Someone else's lock (or lock vanished/reclaimed) — this session
        # no longer holds it; frontend should treat this as lock-lost.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You no longer hold the edit lock for this case.",
        )

    case_lock_crud.touch_heartbeat(db, existing)
    db.commit()
    db.refresh(existing)
    return existing


def release_lock(db: Session, case_id: int, current_user: User) -> None:
    existing = case_lock_crud.get_lock(db, case_id)
    if existing is None:
        return
    # Admins may force-release; otherwise only the holder can release.
    if existing.user_id != current_user.user_id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not hold the edit lock for this case.",
        )
    case_lock_crud.delete_lock(db, case_id)
    db.commit()


def get_lock_status(db: Session, case_id: int) -> CaseLock | None:
    """Read-only check used when opening a case — returns None if unlocked
    or the lock is stale (does not reclaim/delete it, just reports it as free)."""
    existing = case_lock_crud.get_lock(db, case_id)
    if existing is None or _is_stale(existing):
        return None
    return existing