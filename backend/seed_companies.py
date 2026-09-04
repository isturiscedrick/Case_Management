"""
Imports the supervisor-provided company list into companies_reference.
Upserts by company_name - safe to re-run whenever a new CSV drop arrives.

Run: python seed_companies.py
"""

import csv
from pathlib import Path

from app.core.database import SessionLocal
from app.crud import reference as reference_crud

CSV_PATH = Path(__file__).parent / "seed_data" / "company_list.csv"


def run():
    db = SessionLocal()
    try:
        with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=";")
            count = 0
            for row in reader:
                name = row["company"].strip()
                if not name:
                    continue
                reference_crud.get_or_create_company(
                    db,
                    name,
                    company_group=(row.get("company_group") or "").strip() or None,
                    company_group2=(row.get("company_group2") or "").strip() or None,
                )
                count += 1
        db.commit()
        print(f"Seeded/updated {count} companies from {CSV_PATH.name}.")
    finally:
        db.close()


if __name__ == "__main__":
    run()