"""add actor_user_id to notifications

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
"""
from alembic import op
import sqlalchemy as sa

revision = "c4d5e6f7a8b9"
down_revision = "b3c4d5e6f7a8"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notifications", sa.Column("actor_user_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "fk_notifications_actor_user_id",
        "notifications",
        "users",
        ["actor_user_id"],
        ["user_id"],
    )


def downgrade():
    op.drop_constraint("fk_notifications_actor_user_id", "notifications", type_="foreignkey")
    op.drop_column("notifications", "actor_user_id")