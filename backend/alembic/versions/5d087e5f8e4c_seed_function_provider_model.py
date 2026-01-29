"""seed function_provider_model

Revision ID: 5d087e5f8e4c
Revises: c35953ac644a
Create Date: 2026-01-29 19:54:02.592860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '5d087e5f8e4c'
down_revision: Union[str, Sequence[str], None] = 'c35953ac644a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    op.execute(f"""
        INSERT INTO function_provider_model (
            function_id, provider_id, provider_model_id, additional_info, created_on
        )
        SELECT
            f.id,
            p.id,
            pm.id,
            'Default mapping',
            '{now}'
        FROM `function` f
        JOIN provider p ON p.key IN ('openai','gemini','claude','mistral')
        JOIN provider_model pm ON pm.provider_id = p.id
        WHERE
            (f.title = 'Page Analysis' AND pm.title = 'Analysis Model')
            OR (f.title = 'Test Scenarios' AND pm.title = 'Analysis Model')
            OR (f.title = 'Test Scripts' AND pm.title = 'Selenium Model')
        ON DUPLICATE KEY UPDATE
            additional_info = VALUES(additional_info);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM function_provider_model")
