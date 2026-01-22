"""add setting_category_id to setting table

Revision ID: 6de70df750ca
Revises: 28d6155dd9f9
Create Date: 2026-01-22 10:30:18.202679

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6de70df750ca'
down_revision: Union[str, Sequence[str], None] = '3d6a5ed2ed2b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add column to setting table
    op.add_column('setting', sa.Column('setting_category_id', sa.Integer(), nullable=True))
    # Optional: add foreign key if you have setting_category table
    op.create_foreign_key(
        'fk_setting_category',
        source_table='setting',
        referent_table='setting_category',
        local_cols=['setting_category_id'],
        remote_cols=['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_setting_category', 'setting', type_='foreignkey')
    op.drop_column('setting', 'setting_category_id')
