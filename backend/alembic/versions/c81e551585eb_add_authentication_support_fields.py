"""add authentication support fields

Revision ID: c81e551585eb
Revises: 13a2bce86cdb
Create Date: 2026-02-16 15:37:14.201266

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c81e551585eb'
down_revision: Union[str, Sequence[str], None] = '13a2bce86cdb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add auth_detected column to page table
    op.add_column('page', 
        sa.Column('is_auth_detected', sa.Boolean(), nullable=False, server_default=sa.text('0'))
    )
    
    # Add requires_auth column to test_scenario table
    op.add_column('test_scenario',
        sa.Column('requires_auth', sa.Boolean(), nullable=False, server_default=sa.text('0'))
    )
    

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('test_scenario', 'requires_auth')
    op.drop_column('page', 'is_auth_detected')
    
