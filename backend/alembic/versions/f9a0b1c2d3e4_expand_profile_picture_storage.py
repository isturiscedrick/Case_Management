"""expand profile picture storage

Revision ID: f9a0b1c2d3e4
Revises: e8f9a0b1c2d3
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = "f9a0b1c2d3e4"
down_revision = "e8f9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "users",
        "profile_picture",
        existing_type=sa.Text(),
        type_=mysql.MEDIUMTEXT(),
        existing_nullable=True,
    )


def downgrade():
    op.alter_column(
        "users",
        "profile_picture",
        existing_type=mysql.MEDIUMTEXT(),
        type_=sa.Text(),
        existing_nullable=True,
    )
