"""rename test_execution status enum value

Revision ID: 0c56b74227e0
Revises: 2bcfa706991a
Create Date: 2026-03-10 18:51:05.390716
"""

from typing import Sequence, Union
from alembic import op

# revision identifiers
revision: str = '0c56b74227e0'
down_revision: Union[str, Sequence[str], None] = '2bcfa706991a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        ALTER TABLE test_execution 
        MODIFY status ENUM('None','Passed','Partially Passed','Failed') NULL;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        ALTER TABLE test_execution 
        MODIFY status ENUM('NOne','Passed','Partially Passed','Failed') NULL;
    """)