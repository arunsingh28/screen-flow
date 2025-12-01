"""create page visits table

Revision ID: d9e8f7a6b5c4
Revises: c8d9e0f1a2b3
Create Date: 2025-12-01 18:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd9e8f7a6b5c4'
down_revision = 'c8d9e0f1a2b3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('page_visits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('path', sa.String(), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_page_visits_created_at'), 'page_visits', ['created_at'], unique=False)
    op.create_index(op.f('ix_page_visits_id'), 'page_visits', ['id'], unique=False)
    op.create_index(op.f('ix_page_visits_path'), 'page_visits', ['path'], unique=False)
    op.create_index(op.f('ix_page_visits_user_id'), 'page_visits', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_page_visits_user_id'), table_name='page_visits')
    op.drop_index(op.f('ix_page_visits_path'), table_name='page_visits')
    op.drop_index(op.f('ix_page_visits_id'), table_name='page_visits')
    op.drop_index(op.f('ix_page_visits_created_at'), table_name='page_visits')
    op.drop_table('page_visits')
