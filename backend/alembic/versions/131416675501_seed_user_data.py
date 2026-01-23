"""seed user data

Revision ID: 131416675501
Revises: dce725f2abdb
Create Date: 2025-12-16 13:19:01.870405

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '131416675501'
down_revision: Union[str, Sequence[str], None] = 'dce725f2abdb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(f"""
        INSERT INTO user (id, role_id, username, password, name, email, is_active)
        VALUES
            (1, '1', 'lokanathaml', '$2b$12$twZSEb6znRomknJtsyJpZOBJ11vCLs4FPCfy.H1w2yZHov5RxUw52', 'lokanatham latesh', 'lokanathamlatesh@gmail.com', 1),
            (2, '2', 'lateshl', '$2b$12$deFLn6cuNMZqxMj2vYJ34umuWCCyrP/9imW42utqwWB9IXQIaBuTS', 'Lokesh kumar', 'lokanathamlatesh2003@gmail.com', 1)
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM user")
