from typing import Optional
from sqlalchemy.orm import Session

from app.crud import user as user_crud
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.models.user import User


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = user_crud.get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(subject=str(user.user_id), extra_claims={"role": user.role.value}),
        "refresh_token": create_refresh_token(subject=str(user.user_id)),
        "token_type": "bearer",
    }