"""add changes to case_history and history_id to notifications

Revision ID: a9b8c7d6e5f4
Revises: f62566db9497
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = "a9b8c7d6e5f4"
down_revision = "f62566db9497"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("case_history", sa.Column("changes", mysql.MEDIUMTEXT(), nullable=True))
    op.add_column("notifications", sa.Column("history_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "fk_notifications_history_id",
        "notifications",
        "case_history",
        ["history_id"],
        ["history_id"],
    )


def downgrade():
    op.drop_constraint("fk_notifications_history_id", "notifications", type_="foreignkey")
    op.drop_column("notifications", "history_id")
    op.drop_column("case_history", "changes")