"""
CMI Case Management — reset every user's password ahead of deployment,
and print/export the resulting credential list (full name, username,
new temporary password).

WHY THIS EXISTS: passwords are stored as bcrypt hashes (User.hashed_password),
which cannot be reversed. This script ISSUES NEW passwords and shows them to
you exactly once. Distribute them securely, then delete credentials_output.csv.

Run from backend/, with the venv active:
    python reset_all_passwords.py
"""

import csv
import secrets
from pathlib import Path

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

OUTPUT_CSV = Path(__file__).parent / "credentials_output.csv"
ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"


def generate_password(length: int = 12) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def run():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.full_name.asc()).all()
        if not users:
            print("No users found — nothing to reset.")
            return

        rows = []
        for user in users:
            new_password = generate_password()
            user.hashed_password = hash_password(new_password)
            user.failed_login_attempts = 0
            user.locked_until = None
            rows.append({
                "full_name": user.full_name,
                "username": user.username,
                "role": user.role.value,
                "password": new_password,
            })

        db.commit()

        with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["full_name", "username", "role", "password"])
            writer.writeheader()
            writer.writerows(rows)

        print(f"Reset {len(rows)} account(s). Credentials written to {OUTPUT_CSV}\n")
        print(f"{'Full Name':30} {'Username':20} {'Role':20} {'Password'}")
        print("-" * 95)
        for row in rows:
            print(f"{row['full_name']:30} {row['username']:20} {row['role']:20} {row['password']}")

        print(f"\nDistribute these securely, then delete {OUTPUT_CSV.name}.")
    finally:
        db.close()


if __name__ == "__main__":
    run()