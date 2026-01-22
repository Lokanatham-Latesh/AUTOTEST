"""create setting_category table

Revision ID: ac4bb713531d
Revises: 821cca5fc78c
Create Date: 2026-01-21 09:10:34.489317

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac4bb713531d'
down_revision: Union[str, Sequence[str], None] = '821cca5fc78c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'setting_category',
        sa.Column('id', sa.Integer, primary_key=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('setting_category')
