"""seed provider

Revision ID: f5863a409536
Revises: f18bf61406b2
Create Date: 2026-01-29 19:36:53.451411

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = 'f5863a409536'
down_revision: Union[str, Sequence[str], None] = 'f18bf61406b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    op.execute("""
        INSERT INTO provider (title, `key`, is_active, created_on)
        VALUES
        ('OpenAI', 'openai', 1, '{now}'),
        ('Gemini', 'gemini', 1, '{now}'),
        ('Claude', 'claude', 1, '{now}'),
        ('MistralAI', 'mistral', 1, '{now}')
        ON DUPLICATE KEY UPDATE title=VALUES(title), is_active=1;
        """.format(now=now)
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM provider")

