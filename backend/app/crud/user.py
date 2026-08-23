from typing import Optional
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, *, username: str, full_name: str, hashed_password: str, role) -> User:
    user = User(
        username=username,
        full_name=full_name,
        hashed_password=hashed_password,
        role=role,
    )
    db.add(user)
    db.flush()
    return user