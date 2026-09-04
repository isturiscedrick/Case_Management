"""add company_group and company_group2 to companies_reference

Revision ID: c2d5f8a91b47
Revises: a1c9e4f7b2d3
Create Date: 2026-09-04 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c2d5f8a91b47"
down_revision = "a1c9e4f7b2d3"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "companies_reference",
        sa.Column("company_group", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "companies_reference",
        sa.Column("company_group2", sa.String(length=255), nullable=True),
    )


def downgrade():
    op.drop_column("companies_reference", "company_group2")
    op.drop_column("companies_reference", "company_group")