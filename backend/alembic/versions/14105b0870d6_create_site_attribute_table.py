"""create site attribute table

Revision ID: 14105b0870d6
Revises: 0c56b74227e0
Create Date: 2026-03-25 16:20:52.299140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14105b0870d6'
down_revision: Union[str, Sequence[str], None] = '0c56b74227e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('site_attribute',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False, primary_key=True),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('attribute_key', sa.String(length=50), nullable=False, unique=True),
        sa.Column('attribute_title', sa.String(length=200), nullable=False),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('site_attribute')
