"""add JD linking and matching to CV batches

Revision ID: 2025_12_06_0000
Revises: 2025_12_05_0000
Create Date: 2025-12-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2025_12_06_0000'
down_revision = 'add_jd_builder_llm'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Add job_description_id to cv_batches
    cv_batches_columns = [c['name'] for c in inspector.get_columns('cv_batches')]

    if 'job_description_id' not in cv_batches_columns:
        op.add_column('cv_batches', sa.Column('job_description_id', postgresql.UUID(as_uuid=True), nullable=True))
        op.create_index(op.f('ix_cv_batches_job_description_id'), 'cv_batches', ['job_description_id'], unique=False)
        op.create_foreign_key('fk_cv_batches_job_description_id', 'cv_batches', 'job_descriptions', ['job_description_id'], ['id'])

    # Add JD matching columns to cvs
    cvs_columns = [c['name'] for c in inspector.get_columns('cvs')]

    if 'jd_match_score' not in cvs_columns:
        op.add_column('cvs', sa.Column('jd_match_score', sa.Integer(), nullable=True))

    if 'jd_match_data' not in cvs_columns:
        op.add_column('cvs', sa.Column('jd_match_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    # Drop CV matching columns
    op.drop_column('cvs', 'jd_match_data')
    op.drop_column('cvs', 'jd_match_score')

    # Drop job_description_id from cv_batches
    op.drop_constraint('fk_cv_batches_job_description_id', 'cv_batches', type_='foreignkey')
    op.drop_index(op.f('ix_cv_batches_job_description_id'), table_name='cv_batches')
    op.drop_column('cv_batches', 'job_description_id')
