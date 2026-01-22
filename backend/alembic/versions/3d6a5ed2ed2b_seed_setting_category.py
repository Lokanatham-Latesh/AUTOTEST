"""seed setting_category

Revision ID: 3d6a5ed2ed2b
Revises: ac4bb713531d
Create Date: 2026-01-21 10:24:55.492335

"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d6a5ed2ed2b'
down_revision: Union[str, Sequence[str], None] = 'ac4bb713531d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ✅ Seed data
    op.execute(f"""
        INSERT INTO setting_category
            (`id`, `title`)
        VALUES
            (
                1,
                'General Settings'
            ),
            (
                2,
                'LLM Settings'
            ),
            (
                3,
                'Prompt Settings'
            );
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM setting_category")

