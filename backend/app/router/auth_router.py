from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token, create_access_token
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UserOut, UserCreate, UserPasswordReset, UserProfileUpdate, UserRoleUpdate
from app.service import auth_service
from app.service.deps import get_current_user, require_role
from app.models.enums import UserRole
from app.crud import notification as notification_crud

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, payload)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    new_access_token = create_access_token(subject=decoded["sub"])
    return TokenResponse(access_token=new_access_token, refresh_token=payload.refresh_token)


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserOut])
def users(
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return auth_service.list_users(db)


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return auth_service.update_profile(db, current_user, payload)


@router.post("/me/password-reset-request", status_code=status.HTTP_201_CREATED)
def request_password_reset(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins do not need to request password resets.")
    notification = notification_crud.create_password_reset_request(
        db, current_user.user_id, f"{current_user.full_name} ({current_user.username}) requested a password reset."
    )
    db.commit()
    db.refresh(notification)
    return {"message": "Password reset request sent to an administrator."}


@router.put("/users/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def reset_user_password(
    user_id: int,
    payload: UserPasswordReset,
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    auth_service.reset_password(db, user_id, payload)


@router.put("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.admin)),
):
    return auth_service.update_user_role(db, user_id, payload, current_user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.admin)),
):
    auth_service.delete_user(db, user_id, current_user)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return auth_service.register(db, payload)