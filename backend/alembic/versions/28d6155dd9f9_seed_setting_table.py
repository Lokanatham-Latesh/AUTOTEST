"""seed setting table

Revision ID: 28d6155dd9f9
Revises: 3d6a5ed2ed2b
Create Date: 2026-01-22 10:08:45.305180

"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28d6155dd9f9'
down_revision: Union[str, Sequence[str], None] = '6de70df750ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    op.execute(f"""
        INSERT INTO setting (
            setting_category_id, `key`, title, description, type, 
            possible_values, default_value, actual_value, updated_on, updated_by
        ) VALUES
        (1, 'site_name', 'Site Name', 'The name of the site', 'Text', NULL, 'My Website', 'My Website', '{now}', 1),
        (1, 'max_login_attempts', 'Max Login Attempts', 'Maximum login attempts allowed', 'Number', NULL, '5', '5', '{now}', 1),
        (2, 'enable_feature_x', 'Enable Feature X', 'Enable or disable feature X', 'Checkbox', 'Yes|No', 'No', 'No', '{now}', 1),
        (2, 'google_api_key', 'Google API Key', 'Key for Google services integration', 'Text', NULL, '', 'YOUR_GOOGLE_API_KEY_HERE', '{now}', 1),
        (2, 'openai_api_key', 'OpenAI API Key', 'Key for OpenAI API integration', 'Text', NULL, '', 'YOUR_OPENAI_API_KEY_HERE', '{now}', 1)
        ON DUPLICATE KEY UPDATE
            title=VALUES(title),
            description=VALUES(description),
            type=VALUES(type),
            possible_values=VALUES(possible_values),
            default_value=VALUES(default_value),
            actual_value=VALUES(actual_value),
            updated_on=VALUES(updated_on),
            updated_by=VALUES(updated_by);
    """)

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM setting_category")

