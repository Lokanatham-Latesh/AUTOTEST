"""create test suite execution attribute table

Revision ID: 26e9d604f750
Revises: 4fd5e630b937
Create Date: 2026-03-25 16:31:50.864229

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26e9d604f750'
down_revision: Union[str, Sequence[str], None] = '4fd5e630b937'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('test_suite_execution_attribute',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('test_suite_execution_id', sa.Integer(), nullable=False),
        sa.Column('site_attribute_key', sa.String(length=200), nullable=False),
        sa.Column('site_attribute_value', sa.String(length=5000), nullable=True),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('test_suite_execution_attribute')
