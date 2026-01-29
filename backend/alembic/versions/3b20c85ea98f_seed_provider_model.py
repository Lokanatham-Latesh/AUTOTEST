"""seed provider_model

Revision ID: 3b20c85ea98f
Revises: f5863a409536
Create Date: 2026-01-29 19:40:04.920804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b20c85ea98f'
down_revision: Union[str, Sequence[str], None] = 'f5863a409536'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ANALYSIS MODEL (per provider)
    op.execute("""
        INSERT INTO provider_model (provider_id, title, prompt)
        SELECT p.id, 'Analysis Model', 'Default analysis prompt'
        FROM provider p
        WHERE p.key IN ('openai','gemini','claude','mistral')
        ON DUPLICATE KEY UPDATE prompt=VALUES(prompt);
    """)

    # SELENIUM MODEL (per provider)
    op.execute("""
        INSERT INTO provider_model (provider_id, title, prompt)
        SELECT p.id, 'Selenium Model', 'Default selenium generation prompt'
        FROM provider p
        WHERE p.key IN ('openai','gemini','claude','mistral')
        ON DUPLICATE KEY UPDATE prompt=VALUES(prompt);
    """)

    # RESULT ANALYSIS MODEL (per provider)
    op.execute("""
        INSERT INTO provider_model (provider_id, title, prompt)
        SELECT p.id, 'Result Analysis Model', 'Default result analysis prompt'
        FROM provider p
        WHERE p.key IN ('openai','gemini','claude','mistral')
        ON DUPLICATE KEY UPDATE prompt=VALUES(prompt);
    """)

    # TEMPERATURE MODEL (per provider)
    op.execute("""
        INSERT INTO provider_model (provider_id, title, prompt)
        SELECT p.id, 'Temperature Model', 'Default temperature control prompt'
        FROM provider p
        WHERE p.key IN ('openai','gemini','claude','mistral')
        ON DUPLICATE KEY UPDATE prompt=VALUES(prompt);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM provider_model")
