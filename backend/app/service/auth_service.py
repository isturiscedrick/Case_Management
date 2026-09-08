from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.manager import auth_manager
from app.crud import user as user_crud
from app.core.security import hash_password
from app.crud import notification as notification_crud
from app.schemas.auth import LoginRequest, UserCreate, UserPasswordReset, UserProfileUpdate, TokenResponse


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    user = auth_manager.authenticate_user(db, payload.username, payload.password)
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

    user_crud.update_user(db, user, **fields)
    if payload.password and approved_reset:
        notification_crud.consume_approved_password_reset(db, user.user_id)
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: int, payload: UserPasswordReset):
    user = user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    user_crud.update_user(db, user, hashed_password=hash_password(payload.password))
    notification_crud.resolve_for_user(db, user_id)
    db.commit()