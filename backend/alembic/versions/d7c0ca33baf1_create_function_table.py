"""create function table

Revision ID: d7c0ca33baf1
Revises: 0a18ac2ceb4a
Create Date: 2026-01-29 19:25:37.938822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'd7c0ca33baf1'
down_revision: Union[str, Sequence[str], None] = '0a18ac2ceb4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'function',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('prompt', sa.String(5000), nullable=True),
        sa.Column('created_by', sa.Integer, nullable=True),
        sa.Column('created_on', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_by', sa.Integer, nullable=True),
        sa.Column('updated_on', sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('function')