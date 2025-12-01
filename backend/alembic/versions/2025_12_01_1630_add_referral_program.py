"""add referral program

Revision ID: b2c3d4e5f6g7
Revises: cc7250d554a1
Create Date: 2025-12-01 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'cc7250d554a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create referrals table
    op.create_table('referrals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('referrer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('referred_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', name='referral_status_enum'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['referrer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['referred_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('referred_user_id')
    )
    op.create_index(op.f('ix_referrals_id'), 'referrals', ['id'], unique=False)

    # Add referral_code to users
    op.add_column('users', sa.Column('referral_code', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_referral_code'), 'users', ['referral_code'], unique=True)

    # Handle Enum update for credit_transactions
    # We use execute to run raw SQL for altering enum
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE credit_txn_type_final ADD VALUE IF NOT EXISTS 'REFERRAL_BONUS'")

    # Recreate credit_transactions table
    op.create_table('credit_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('PURCHASE', 'USAGE', 'REFERRAL_BONUS', name='credit_txn_type_final'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_credit_transactions_id'), 'credit_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_credit_transactions_user_id'), 'credit_transactions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_credit_transactions_user_id'), table_name='credit_transactions')
    op.drop_index(op.f('ix_credit_transactions_id'), table_name='credit_transactions')
    op.drop_table('credit_transactions')
    
    op.drop_index(op.f('ix_users_referral_code'), table_name='users')
    op.drop_column('users', 'referral_code')
    
    op.drop_index(op.f('ix_referrals_id'), table_name='referrals')
    op.drop_table('referrals')
    
    # We cannot easily remove value from Enum in Postgres
    op.execute("DROP TYPE referral_status_enum")
