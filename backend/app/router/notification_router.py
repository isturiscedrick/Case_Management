from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import UserRole
from app.schemas.notification import NotificationOut
from app.service.deps import get_current_user, require_role
from app.crud import notification as notification_crud

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