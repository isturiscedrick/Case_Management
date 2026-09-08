"""add profile pictures to users

Revision ID: d7e8f9a0b1c2
Revises: c2d5f8a91b47
"""
from alembic import op
import sqlalchemy as sa

revision = "d7e8f9a0b1c2"
down_revision = "c2d5f8a91b47"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("profile_picture", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("users", "profile_picture")