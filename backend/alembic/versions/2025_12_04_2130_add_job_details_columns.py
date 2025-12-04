"""add job details columns

Revision ID: 2025_12_04_2130
Revises: 2025_12_01_1900
Create Date: 2025-12-04 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2025_12_04_2130'
down_revision = '2025_12_01_1900'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('cv_batches')]

    if 'employment_type' not in columns:
        op.add_column('cv_batches', sa.Column('employment_type', sa.String(), nullable=True))
    if 'seniority_level' not in columns:
        op.add_column('cv_batches', sa.Column('seniority_level', sa.String(), nullable=True))
    if 'experience_range' not in columns:
        op.add_column('cv_batches', sa.Column('experience_range', sa.ARRAY(sa.Integer()), nullable=True))
    if 'company_type' not in columns:
        op.add_column('cv_batches', sa.Column('company_type', sa.String(), nullable=True))
    if 'industry' not in columns:
        op.add_column('cv_batches', sa.Column('industry', sa.String(), nullable=True))
    if 'prior_roles' not in columns:
        op.add_column('cv_batches', sa.Column('prior_roles', sa.String(), nullable=True))
    if 'is_archived' not in columns:
        op.add_column('cv_batches', sa.Column('is_archived', sa.Boolean(), server_default='false', nullable=True))


def downgrade() -> None:
    op.drop_column('cv_batches', 'is_archived')
    op.drop_column('cv_batches', 'prior_roles')
    op.drop_column('cv_batches', 'industry')
    op.drop_column('cv_batches', 'company_type')
    op.drop_column('cv_batches', 'experience_range')
    op.drop_column('cv_batches', 'seniority_level')
    op.drop_column('cv_batches', 'employment_type')
