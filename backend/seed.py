"""
One-time seed script — creates the default admin user described in
database-diagram.md's "Seed Data" section (user_id=1, 'Current User', admin).

Run after migrations: python seed.py
"""

from app.core.database import SessionLocal
from app.crud import user as user_crud
from app.core.security import hash_password
from app.models.enums import UserRole


def run():
    db = SessionLocal()
    try:
        existing = user_crud.get_user_by_username(db, "admin")
        if existing:
            print("Seed user already exists — skipping.")
            return

        user_crud.create_user(
            db,
            username="admin",
            full_name="Current User",
            hashed_password=hash_password("change-me-immediately"),
            role=UserRole.admin,
        )
        db.commit()
        print("Seed admin user created: username='admin', password='change-me-immediately'")
        print("Change this password immediately in a real environment.")
    finally:
        db.close()


if __name__ == "__main__":
    run()