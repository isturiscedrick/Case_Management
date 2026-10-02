"""add Denied to tribunal decision status

Revision ID: b5c6d7e8f9a0
Revises: a9b8c7d6e5f4
"""
from alembic import op
import sqlalchemy as sa

revision = "b5c6d7e8f9a0"
down_revision = "a9b8c7d6e5f4"
branch_labels = None
depends_on = None

_BASE_VALUES = (
    "Valid_Dismissal",
    "Illegal_Dismissal",
    "Convicted",
    "Acquitted",
    "Dismissed",
    "Affirmed",
    "Pending",
    "Closed",
    "Execution",
)


def upgrade():
    op.alter_column(
        "decisions",
        "status",
        existing_type=sa.Enum(*_BASE_VALUES, name="tribunaldecisionstatus"),
        type_=sa.Enum(*_BASE_VALUES, "Denied", name="tribunaldecisionstatus"),
        existing_nullable=True,
    )


def downgrade():
    # NOTE: fails (or truncates, depending on MySQL strict mode) if any rows
    # have status = 'Denied'. Reassign those rows before downgrading.
    op.alter_column(
        "decisions",
        "status",
        existing_type=sa.Enum(*_BASE_VALUES, "Denied", name="tribunaldecisionstatus"),
        type_=sa.Enum(*_BASE_VALUES, name="tribunaldecisionstatus"),
        existing_nullable=True,
    )