"""merge heads

Revision ID: 13a2bce86cdb
Revises: 405eda20ce73, 5d087e5f8e4c
Create Date: 2026-02-04 15:49:48.982941

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13a2bce86cdb'
down_revision: Union[str, Sequence[str], None] = ('405eda20ce73', '5d087e5f8e4c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
