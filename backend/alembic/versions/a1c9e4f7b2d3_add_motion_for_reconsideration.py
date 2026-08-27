"""add motion for reconsideration to tribunal_remarks

Revision ID: a1c9e4f7b2d3
Revises: eb46fdd26fc3
Create Date: 2026-08-27 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1c9e4f7b2d3"
down_revision = "eb46fdd26fc3"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "decisions",
        "remarks",
        existing_type=sa.Enum(
            "Appealed by Respondent",
            "Appealed by Complainant",
            "Not Appealed",
            "Other",
            name="tribunalremarks",
        ),
        type_=sa.Enum(
            "Appealed by Respondent",
            "Appealed by Complainant",
            "Not Appealed",
            "Motion for Reconsideration",
            "Other",
            name="tribunalremarks",
        ),
        existing_nullable=True,
    )


def downgrade():
    # NOTE: if any existing rows have remarks = 'Motion for Reconsideration',
    # this downgrade will fail (or silently truncate, depending on MySQL's
    # strict mode) since that value won't fit the narrower enum. Clear or
    # reassign those rows before downgrading if needed.
    op.alter_column(
        "decisions",
        "remarks",
        existing_type=sa.Enum(
            "Appealed by Respondent",
            "Appealed by Complainant",
            "Not Appealed",
            "Motion for Reconsideration",
            "Other",
            name="tribunalremarks",
        ),
        type_=sa.Enum(
            "Appealed by Respondent",
            "Appealed by Complainant",
            "Not Appealed",
            "Other",
            name="tribunalremarks",
        ),
        existing_nullable=True,
    )