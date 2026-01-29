"""create function_provider_model table

Revision ID: f18bf61406b2
Revises: d7c0ca33baf1
Create Date: 2026-01-29 19:26:47.187150

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'f18bf61406b2'
down_revision: Union[str, Sequence[str], None] = 'd7c0ca33baf1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'function_provider_model',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('function_id', sa.Integer, sa.ForeignKey('function.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('provider_id', sa.Integer, sa.ForeignKey('provider.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('provider_model_id', sa.Integer, sa.ForeignKey('provider_model.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('additional_info', sa.String(5000), nullable=True),
        sa.Column('created_by', sa.Integer, nullable=True),
        sa.Column('created_on', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_by', sa.Integer, nullable=True),
        sa.Column('updated_on', sa.DateTime, nullable=True),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('function_provider_model')