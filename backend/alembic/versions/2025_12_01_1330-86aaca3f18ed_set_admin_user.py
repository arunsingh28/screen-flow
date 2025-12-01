"""set_admin_user

Revision ID: 86aaca3f18ed
Revises: d9e8f7a6b5c4
Create Date: 2025-12-01 13:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "86aaca3f18ed"
down_revision: Union[str, None] = "d9e8f7a6b5c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update arun@gmail.com to ADMIN role
    op.execute(
        """
        UPDATE users 
        SET role = 'ADMIN' 
        WHERE email = 'arun@gmail.com'
    """
    )


def downgrade() -> None:
    # Revert arun@gmail.com back to USER role
    op.execute(
        """
        UPDATE users 
        SET role = 'USER' 
        WHERE email = 'arun@gmail.com'
    """
    )
