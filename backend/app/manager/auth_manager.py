from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.user import User

# --- Login lockout rules (NEW) --------------------------------------------
# 3 wrong passwords in a row locks the account. How long depends on how
# many times this account has been locked before (lockout_offense_count):
#   1st offense -> 5 minutes
#   2nd offense -> 1 hour
#   3rd+ offense -> 24 hours (capped, does not keep growing)
# The lock clears itself automatically once locked_until is in the past —
# no cron job needed, same "lazy expiry" pattern used for case edit locks
# in case_lock_service.py. The offense count itself does NOT reset on a
# successful login; it only resets when an admin explicitly disregards it
# (see auth_service.py / notification_router.py).
MAX_FAILED_LOGIN_ATTEMPTS = 3
LOCKOUT_TIERS_MINUTES = [5, 60, 60 * 24]  # 5 min, 1 hr, 24 hr


def _lockout_minutes_for_offense(offense_count: int) -> int:
    index = min(offense_count - 1, len(LOCKOUT_TIERS_MINUTES) - 1)
    return LOCKOUT_TIERS_MINUTES[index]


class AccountLockedError(Exception):
    """Raised when a login attempt comes in while the account is ALREADY
    locked out from a previous offense. Carries the timestamp the lock
    expires at so the caller can report how long is left."""

    def __init__(self, unlock_at: datetime):
        self.unlock_at = unlock_at
        super().__init__(f"Account locked until {unlock_at.isoformat()}.")


class AccountJustLockedError(Exception):
    """Raised the MOMENT an account crosses the failed-attempt threshold
    and becomes newly locked (i.e. this very attempt was the 3rd/6th/9th
    failure). Distinct from AccountLockedError so the service layer can
    notify admins exactly once per lockout event, not on every subsequent
    attempt against an already-locked account."""

    def __init__(self, unlock_at: datetime, offense_count: int, username: str, user_id: int):
        self.unlock_at = unlock_at
        self.offense_count = offense_count
        self.username = username
        self.user_id = user_id
        super().__init__(f"Account newly locked until {unlock_at.isoformat()} (offense #{offense_count}).")


def _now() -> datetime:
    # DB columns are naive DATETIME (server_default now()) — compare
    # naive-to-naive, matching case_lock_service.py's _naive_utcnow().
    return datetime.now(timezone.utc).replace(tzinfo=None)


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = user_crud.get_user_by_username(db, username)
    if not user:
        return None

    now = _now()

    if user.locked_until and user.locked_until > now:
        raise AccountLockedError(user.locked_until)

    if not verify_password(password, user.hashed_password):
        # A previous lock window that has already expired shouldn't count
        # toward a new attempt streak — start fresh.
        if user.locked_until and user.locked_until <= now:
            user.failed_login_attempts = 0
            user.locked_until = None

        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1

        if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            offense_count = (user.lockout_offense_count or 0) + 1
            user.lockout_offense_count = offense_count
            minutes = _lockout_minutes_for_offense(offense_count)
            user.locked_until = now + timedelta(minutes=minutes)
            user.failed_login_attempts = 0
            db.commit()
            raise AccountJustLockedError(user.locked_until, offense_count, user.username, user.user_id)

        db.commit()
        return None

    # Correct password — clear the failed-attempt streak and any lock.
    # lockout_offense_count is intentionally left untouched (see class
    # docstring above / models/user.py).
    if user.failed_login_attempts or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    return user


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(subject=str(user.user_id), extra_claims={"role": user.role.value}),
        "refresh_token": create_refresh_token(subject=str(user.user_id)),
        "token_type": "bearer",
    }