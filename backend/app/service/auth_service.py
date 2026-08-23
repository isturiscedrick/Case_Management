from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.manager import auth_manager
from app.crud import user as user_crud
from app.core.security import hash_password
from app.schemas.auth import LoginRequest, UserCreate, TokenResponse


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