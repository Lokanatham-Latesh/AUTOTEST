"""create provider table

Revision ID: 6c66fcd39368
Revises: 28d6155dd9f9
Create Date: 2026-01-29 19:13:28.098798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '6c66fcd39368'
down_revision: Union[str, Sequence[str], None] = '28d6155dd9f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'provider',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('key', sa.String(200), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_by', sa.Integer),
        sa.Column('created_on', sa.DateTime),
        sa.Column('updated_by', sa.Integer),
        sa.Column('updated_on', sa.DateTime),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('provider')

