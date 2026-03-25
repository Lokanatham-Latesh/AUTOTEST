"""create test suite step table

Revision ID: 54a59124c36a
Revises: 26e9d604f750
Create Date: 2026-03-25 16:33:05.305024

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '54a59124c36a'
down_revision: Union[str, Sequence[str], None] = '26e9d604f750'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    op.create_table(
        'test_suite_step',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('test_suite_id', sa.Integer, sa.ForeignKey('test_suite.id'), nullable=False, index=True),
        sa.Column('step_number', sa.Integer, nullable=False),
        sa.Column('node_id', sa.Integer, nullable=False),
        sa.Column('label', sa.String(50), nullable=False),
        sa.Column('page_id', sa.Integer, sa.ForeignKey('page.id'), nullable=False),
        sa.Column('scenario_id', sa.Integer, sa.ForeignKey('test_scenario.id'), nullable=False),
        sa.Column('step_order', sa.Integer, nullable=False),
        sa.Column('created_on', sa.DateTime, nullable=True),
        sa.Column('created_by', sa.Integer, sa.ForeignKey('user.id'), nullable=True)
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('test_suite_step')
