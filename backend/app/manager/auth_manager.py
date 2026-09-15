from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.user import User

# --- Login lockout rules (NEW) --------------------------------------------
# 3 wrong passwords in a row locks the account for 15 minutes. The lock
# clears itself automatically once locked_until is in the past — no cron
# job or background task needed, same "lazy expiry" pattern already used
# for case edit locks in case_lock_service.py.
MAX_FAILED_LOGIN_ATTEMPTS = 3
LOCKOUT_DURATION_MINUTES = 15


class AccountLockedError(Exception):
    """Raised by authenticate_user when the account is currently locked
    out due to too many recent failed password attempts. Carries the
    timestamp the lock expires at so the caller can report how long is
    left."""

    def __init__(self, unlock_at: datetime):
        self.unlock_at = unlock_at
        super().__init__(f"Account locked until {unlock_at.isoformat()}.")


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
        # toward a new one — start the streak fresh.
        if user.locked_until and user.locked_until <= now:
            user.failed_login_attempts = 0
            user.locked_until = None

        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        db.commit()
        return None

    # Correct password — clear any prior failure streak/lock.
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