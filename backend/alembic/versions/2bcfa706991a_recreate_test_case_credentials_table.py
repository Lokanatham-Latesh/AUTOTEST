"""recreate test_case_credentials table

Revision ID: 2bcfa706991a
Revises: cd6dd729be79
Create Date: 2026-03-07 14:08:54.974195
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '2bcfa706991a'
down_revision: Union[str, Sequence[str], None] = 'cd6dd729be79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'test_case_credentials',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('page_id', sa.Integer(), nullable=False),
        sa.Column('placeholder_key', sa.String(255), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('created_on', sa.DateTime(), nullable=True)
    )

    op.create_index(
        'uq_page_placeholder',
        'test_case_credentials',
        ['page_id', 'placeholder_key'],
        unique=True
    )

    op.create_index(
        'ix_test_case_credentials_page_id',
        'test_case_credentials',
        ['page_id'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_test_case_credentials_page_id', table_name='test_case_credentials')
    op.drop_index('uq_page_placeholder', table_name='test_case_credentials')
    op.drop_table('test_case_credentials')