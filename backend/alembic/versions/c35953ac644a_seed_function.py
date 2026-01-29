"""seed function

Revision ID: c35953ac644a
Revises: 3b20c85ea98f
Create Date: 2026-01-29 19:47:23.175079

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = 'c35953ac644a'
down_revision: Union[str, Sequence[str], None] = '3b20c85ea98f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    op.execute(f"""
        INSERT INTO `function` (title, prompt, created_on, updated_on)
        VALUES
        ('Page Analysis', 'Analyze page layout, elements, validations', '{now}', '{now}'),
        ('Test Scenarios', 'Generate detailed test scenarios', '{now}', '{now}'),
        ('Test Scripts', 'Generate production-ready automation scripts', '{now}', '{now}')
        ON DUPLICATE KEY UPDATE
            prompt=VALUES(prompt),
            updated_on=VALUES(updated_on);
    """)

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM function")