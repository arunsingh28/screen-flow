"""add referral program

Revision ID: b2c3d4e5f6g7
Revises: cc7250d554a1
Create Date: 2025-12-01 16:30:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6g7"
down_revision = "cc7250d554a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create referral_status_enum if it doesn't exist
    conn = op.get_bind()
    result = conn.execute(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status_enum')"
        )
    )
    enum_exists = result.scalar()

    if not enum_exists:
        # Create the enum type
        sa.Enum("PENDING", "COMPLETED", name="referral_status_enum").create(conn)

    # Create referrals table
    op.create_table(
        "referrals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("referrer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("referred_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "COMPLETED", name="referral_status_enum"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["referrer_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["referred_user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("referred_user_id"),
    )
    op.create_index(op.f("ix_referrals_id"), "referrals", ["id"], unique=False)

    # Add referral_code to users
    op.add_column("users", sa.Column("referral_code", sa.String(), nullable=True))
    op.create_index(
        op.f("ix_users_referral_code"), "users", ["referral_code"], unique=True
    )

    # Add new value to credit_txn_type_final enum
    op.execute(
        "ALTER TYPE credit_txn_type_final ADD VALUE IF NOT EXISTS 'REFERRAL_BONUS'"
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_referral_code"), table_name="users")
    op.drop_column("users", "referral_code")

    op.drop_index(op.f("ix_referrals_id"), table_name="referrals")
    op.drop_table("referrals")

    # Note: We cannot easily remove value from Enum in Postgres without recreating it
