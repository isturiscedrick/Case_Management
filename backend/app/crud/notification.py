from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_password_reset_request(db: Session, user_id: int, message: str) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type="password_reset",
        message=message,
        status="pending",
    )
    db.add(notification)
    db.flush()
    return notification


def list_pending(db: Session):
    return db.query(Notification).filter(Notification.status == "pending").order_by(Notification.created_at.desc()).all()


def list_decided(db: Session):
    return db.query(Notification).filter(Notification.status.in_(["approved", "declined"])).order_by(Notification.resolved_at.desc()).all()


def list_for_user(db: Session, user_id: int):
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.status != "pending",
    ).order_by(Notification.created_at.desc()).all()


def resolve_for_user(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.notification_type == "password_reset",
        Notification.status == "pending",
    ).update({"status": "resolved", "resolved_at": datetime.utcnow()})


def update_status(db: Session, notification_id: int, status: str) -> Notification | None:
    notification = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notification:
        return None
    notification.status = status
    notification.resolved_at = datetime.utcnow()
    db.flush()
    return notification


def consume_approved_password_reset(db: Session, user_id: int) -> None:
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.notification_type == "password_reset",
        Notification.status == "approved",
    ).update({"status": "resolved", "resolved_at": datetime.utcnow()})


def has_approved_password_reset(db: Session, user_id: int) -> bool:
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.notification_type == "password_reset",
        Notification.status == "approved",
    ).first() is not None
