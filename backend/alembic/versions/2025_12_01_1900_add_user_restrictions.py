"""add user restrictions

Revision ID: 2025_12_01_1900
Revises: 2025_12_01_1800
Create Date: 2025-12-01 19:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "2025_12_01_1900"
down_revision: Union[str, None] = "86aaca3f18ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column(
        "users",
        sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column(
            "can_create_jobs", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "cv_upload_limit", sa.Integer(), nullable=False, server_default="100"
        ),
    )


def downgrade() -> None:
    # Remove columns
    op.drop_column("users", "cv_upload_limit")
    op.drop_column("users", "can_create_jobs")
    op.drop_column("users", "is_blocked")
