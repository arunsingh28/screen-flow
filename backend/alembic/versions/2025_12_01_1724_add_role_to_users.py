"""Add role to users

Revision ID: c8d9e0f1a2b3
Revises: b2c3d4e5f6g7
Create Date: 2025-12-01 17:24:00

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c8d9e0f1a2b3"
down_revision = "b2c3d4e5f6g7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add role column to users table
    op.add_column(
        "users", sa.Column("role", sa.String(), nullable=False, server_default="USER")
    )

    # Set specific user as admin (replace with your email)
    op.execute("UPDATE users SET role = 'ADMIN' WHERE email = 'arun@gmail.com'")


def downgrade() -> None:
    op.drop_column("users", "role")
