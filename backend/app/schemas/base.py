from datetime import datetime, timezone
from typing import Optional


def as_utc(value: Optional[datetime]) -> Optional[datetime]:
    """
    Attach an explicit UTC tzinfo to a naive datetime.

    Every datetime column in this app is a naive MySQL DATETIME whose
    stored value is actually UTC wall-clock time (see core/database.py's
    `SET time_zone = '+00:00'` on every connection). Pydantic serializes
    a naive datetime with no offset (e.g. "2026-09-25T10:15:30"), which
    lets a client silently misinterpret it as local time instead of UTC.
    Attaching tzinfo here makes every serialized timestamp carry an
    explicit "+00:00" offset, so it's unambiguous regardless of who
    consumes the API.
    """
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)