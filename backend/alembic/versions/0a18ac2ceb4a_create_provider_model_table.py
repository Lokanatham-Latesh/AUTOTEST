"""create provider_model table

Revision ID: 0a18ac2ceb4a
Revises: 6c66fcd39368
Create Date: 2026-01-29 19:24:03.080573

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '0a18ac2ceb4a'
down_revision: Union[str, Sequence[str], None] = '6c66fcd39368'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'provider_model',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('provider_id', sa.Integer, sa.ForeignKey('provider.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('prompt', sa.String(5000), nullable=True),
        sa.Column('created_by', sa.Integer, nullable=True),
        sa.Column('created_on', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_by', sa.Integer, nullable=True),
        sa.Column('updated_on', sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('provider_model')
