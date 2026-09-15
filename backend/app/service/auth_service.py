from datetime import datetime, timezone
from math import ceil

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.manager import auth_manager
from app.crud import user as user_crud
from app.crud import notification as notification_crud
from app.core.security import hash_password, verify_password
from app.models.enums import UserRole
from app.schemas.auth import LoginRequest, UserCreate, UserPasswordReset, UserProfileUpdate, UserRoleUpdate, TokenResponse


def _format_wait(delta_seconds: float) -> str:
    """Human-friendly wait time: '5 minutes', '1 hour', '2 days', etc.
    Always rounds up so the message never understates how long is left."""
    minutes = max(1, ceil(delta_seconds / 60))
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = ceil(minutes / 60)
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''}"
    days = ceil(hours / 24)
    return f"{days} day{'s' if days != 1 else ''}"


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    try:
        user = auth_manager.authenticate_user(db, payload.username, payload.password)
    except auth_manager.AccountJustLockedError as exc:
        # This very attempt was the one that tipped the account into a new
        # lockout — alert every admin, exactly once per offense.
        wait_text = _format_wait((exc.unlock_at - now).total_seconds())
        message = (
            f'"{exc.username}" was locked out after {auth_manager.MAX_FAILED_LOGIN_ATTEMPTS} '
            f"failed login attempts (offense #{exc.offense_count}, locked for {wait_text})."
        )
        admins = [u for u in user_crud.list_users(db) if u.role == UserRole.admin]
        for admin in admins:
            notification_crud.create_account_lockout_notification(db, admin.user_id, message, exc.user_id)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Too many failed login attempts. Account locked for {wait_text}.",
        )
    except auth_manager.AccountLockedError as exc:
        # Account was already locked from a prior offense — no new
        # notification, just tell the user how much longer to wait.
        wait_text = _format_wait((exc.unlock_at - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked. Try again in {wait_text}.",
        )

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password.")
    if user.is_active != "Y":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated.")
    tokens = auth_manager.issue_tokens(user)
    return TokenResponse(**tokens)


def register(db: Session, payload: UserCreate):
    existing = user_crud.get_user_by_username(db, payload.username)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")
    user = user_crud.create_user(
        db, username=payload.username, full_name=payload.full_name,
        hashed_password=hash_password(payload.password), role=payload.role,
    )
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session):
    return user_crud.list_users(db)


def update_user_role(db: Session, user_id: int, payload: UserRoleUpdate, current_user):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role.")
    user = user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user_crud.update_user(db, user, role=payload.role)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int, current_user):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account.")
    user = user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user_crud.delete_user(db, user)
    db.commit()


def update_profile(db: Session, user, payload: UserProfileUpdate):
    existing = user_crud.get_user_by_username(db, payload.username)
    if existing and existing.user_id != user.user_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken.")

    fields = {
        "username": payload.username.strip(),
        "full_name": payload.full_name.strip(),
        "profile_picture": payload.profile_picture,
    }
    approved_reset = bool(user.role.value != "admin" and notification_crud.has_approved_password_reset(db, user.user_id))
    if payload.password and user.role.value != "admin":
        if not approved_reset and (not payload.current_password or not verify_password(payload.current_password, user.hashed_password)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is required and must be correct to set a new password.")

    if payload.password:
        fields["hashed_password"] = hash_password(payload.password)
        # Proving your identity with a real password change clears the
        # failed-attempt streak/lock, but NOT the persistent offense
        # count — that still needs an admin's explicit "Disregard".
        fields["failed_login_attempts"] = 0
        fields["locked_until"] = None

    user_crud.update_user(db, user, **fields)
    if payload.password:
        notification_crud.create_password_changed_notification(db, user.user_id)
        if approved_reset:
            notification_crud.consume_approved_password_reset(db, user.user_id)
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: int, payload: UserPasswordReset):
    user = user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    # An admin-issued reset clears the failed-attempt streak/lock so the
    # user can sign in with their new password immediately. It does NOT
    # clear lockout_offense_count on its own — disregarding the offense is
    # a separate, explicit action from the Notifications page, so the
    # strike history stays visible until an admin deliberately clears it.
    user_crud.update_user(
        db, user,
        hashed_password=hash_password(payload.password),
        failed_login_attempts=0,
        locked_until=None,
    )
    notification_crud.resolve_for_user(db, user_id)
    db.commit()