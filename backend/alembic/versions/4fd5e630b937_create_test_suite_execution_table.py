"""create test suite execution table

Revision ID: 4fd5e630b937
Revises: 133567a81678
Create Date: 2026-03-25 16:27:50.299546

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fd5e630b937'
down_revision: Union[str, Sequence[str], None] = '133567a81678'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table('test_suite_execution',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('test_suite_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'running', 'passed', 'partially_passed', 'failed', 'error'), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('execution_summary', sa.JSON(), nullable=True),
        sa.Column('executed_by', sa.Integer(), nullable=True),
        sa.Column('created_on', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('updated_on', sa.DateTime(), nullable=False),
        sa.Column('updated_by', sa.Integer(), nullable=False)
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('test_suite_execution')
