from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import UserRole
from app.schemas.notification import NotificationOut
from app.service.deps import get_current_user, require_role
from app.crud import notification as notification_crud
from app.crud import user as user_crud

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return notification_crud.list_for_user(db, current_user.user_id)


@router.get("/pending", response_model=list[NotificationOut])
def pending_notifications(
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return notification_crud.list_pending(db)


@router.get("/decided", response_model=list[NotificationOut])
def decided_notifications(
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return notification_crud.list_decided(db)


def _decide_notification(notification_id: int, decision: str, db: Session):
    notification = notification_crud.update_status(db, notification_id, decision)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/{notification_id}/approve", response_model=NotificationOut)
def approve_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return _decide_notification(notification_id, "approved", db)


@router.post("/{notification_id}/decline", response_model=NotificationOut)
def decline_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    return _decide_notification(notification_id, "declined", db)


# NEW — lets an admin clear a user's login-lockout strike. This resets the
# offending user's lockout_offense_count (so their next lockout starts
# back at tier 1 / 5 minutes) and unlocks them immediately if they're
# currently locked, then resolves this alert AND every other admin's copy
# of the same alert (see notification_crud.resolve_lockout_notifications_for_user).
@router.post("/{notification_id}/disregard-lockout", response_model=NotificationOut)
def disregard_lockout(
    notification_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_role(UserRole.admin)),
):
    notification = notification_crud.get_notification(db, notification_id)
    if not notification or notification.notification_type != "account_lockout":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lockout notification not found.")

    if notification.actor_user_id:
        locked_user = user_crud.get_user_by_id(db, notification.actor_user_id)
        if locked_user:
            user_crud.update_user(
                db, locked_user,
                failed_login_attempts=0,
                locked_until=None,
                lockout_offense_count=0,
            )
        notification_crud.resolve_lockout_notifications_for_user(db, notification.actor_user_id)
    else:
        # The locked-out user's account was since deleted — just resolve
        # this admin's own copy of the alert.
        notification_crud.update_status(db, notification_id, "resolved")

    db.commit()
    db.refresh(notification)
    return notification


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification = notification_crud.mark_read(db, notification_id, current_user.user_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    db.commit()
    db.refresh(notification)
    return notification