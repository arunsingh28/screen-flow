"""add user restrictions

Revision ID: 2025_12_01_1900
Revises: 2025_12_01_1800
Create Date: 2025-12-01 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_12_01_1900'
down_revision = 'd9e8f7a6b5c4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('can_create_jobs', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('cv_upload_limit', sa.Integer(), nullable=False, server_default='100'))


def downgrade() -> None:
    # Remove columns
    op.drop_column('users', 'cv_upload_limit')
    op.drop_column('users', 'can_create_jobs')
    op.drop_column('users', 'is_blocked')
