"""add case_locks table for concurrent-edit locking

Revision ID: b3c4d5e6f7a8
Revises: f9a0b1c2d3e4
"""
from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a8"
down_revision = "f9a0b1c2d3e4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "case_locks",
        sa.Column("case_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(length=150), nullable=False),
        sa.Column("locked_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.Column("last_heartbeat_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.case_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"]),
        sa.PrimaryKeyConstraint("case_id"),
    )


def downgrade():
    op.drop_table("case_locks")