from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.history import CaseHistory
from app.models.notification import Notification

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def list_users(db: Session) -> List[User]:
    return db.query(User).order_by(User.full_name.asc(), User.username.asc()).all()


def update_user(db: Session, user: User, **fields) -> User:
    for key, value in fields.items():
        setattr(user, key, value)
    db.flush()
    return user


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


def delete_user(db: Session, user: User) -> None:
    db.query(Case).filter(
        (Case.created_by_user_id == user.user_id) | (Case.updated_by_user_id == user.user_id)
    ).update({Case.created_by_user_id: None, Case.updated_by_user_id: None}, synchronize_session=False)
    db.query(CaseHistory).filter(CaseHistory.performed_by_user_id == user.user_id).update(
        {CaseHistory.performed_by_user_id: None}, synchronize_session=False
    )
    db.query(Notification).filter(Notification.user_id == user.user_id).delete(synchronize_session=False)
    db.delete(user)
    db.flush()