from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification


def get_notification(db: Session, notification_id: int) -> Notification | None:
    return db.query(Notification).filter(Notification.notification_id == notification_id).first()


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


def create_case_update_notification(
    db: Session, user_id: int, message: str, *, actor_user_id: int | None = None
) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type="case_update",
        message=message,
        status="unread",
        actor_user_id=actor_user_id,  # + NEW — who performed the update, so
        # the notification can show their profile picture instead of the
        # recipient's own.
    )
    db.add(notification)
    db.flush()
    return notification


# NEW — logs a user's own password change as an already-resolved
# notification so it never surfaces as "pending" anywhere, but can still
# be listed on the Activity page alongside Created/Updated/Archived case
# actions.
def create_password_changed_notification(db: Session, user_id: int) -> Notification:
    notification = Notification(
        user_id=user_id,
        notification_type="password_changed",
        message="Password changed.",
        status="resolved",
        resolved_at=datetime.utcnow(),
    )
    db.add(notification)
    db.flush()
    return notification


# NEW — sent to ONE admin when a user's account gets newly locked out.
# actor_user_id holds the locked-out user's id, reusing the existing
# "actor" field to mean "who this notification concerns" rather than
# strictly "who performed an action" — same field, same convention as
# case_update notifications, just a different relationship.
def create_account_lockout_notification(
    db: Session, admin_user_id: int, message: str, actor_user_id: int
) -> Notification:
    notification = Notification(
        user_id=admin_user_id,
        notification_type="account_lockout",
        message=message,
        status="pending",
        actor_user_id=actor_user_id,
    )
    db.add(notification)
    db.flush()
    return notification


# NEW — when one admin disregards a lockout offense, every OTHER admin's
# copy of that same lockout alert should also stop showing as pending,
# so nobody double-handles (or gets confused by) a stale notification for
# an offense that's already been cleared.
def resolve_lockout_notifications_for_user(db: Session, actor_user_id: int) -> None:
    db.query(Notification).filter(
        Notification.notification_type == "account_lockout",
        Notification.actor_user_id == actor_user_id,
        Notification.status == "pending",
    ).update({"status": "resolved", "resolved_at": datetime.utcnow()}, synchronize_session=False)


def list_pending(db: Session):
    return db.query(Notification).filter(Notification.status == "pending").order_by(Notification.created_at.desc()).all()


def list_decided(db: Session):
    return db.query(Notification).filter(Notification.status.in_(["approved", "declined"])).order_by(Notification.resolved_at.desc()).all()


def list_for_user(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()


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


# NEW — lets the notification's OWNER (the case creator) dismiss a
# case_update notification once they've seen it. Scoped to user_id so a
# person can only mark their own notifications read, never someone else's.
def mark_read(db: Session, notification_id: int, user_id: int) -> Notification | None:
    notification = db.query(Notification).filter(
        Notification.notification_id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if not notification:
        return None
    notification.status = "read"
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


# NEW — nulls out actor_user_id on OTHER users' notifications where this
# user was the actor (e.g. they updated someone else's case, or this was
# the locked-out user in an account_lockout notification). Called from
# crud/user.py::delete_user before that user's own notifications (as
# recipient) are deleted, so notifications belonging to other users
# survive the deletion intact, just without a picture/name/target to show
# for the now-gone actor.
def clear_actor_references(db: Session, actor_user_id: int) -> None:
    db.query(Notification).filter(Notification.actor_user_id == actor_user_id).update(
        {"actor_user_id": None}, synchronize_session=False
    )