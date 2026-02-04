"""add model and temperature to provider_model

Revision ID: 405eda20ce73
Revises: 5d087e5f8e4c
Create Date: 2026-02-04 15:19:53.991943

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '405eda20ce73'
down_revision: Union[str, Sequence[str], None] = '0a18ac2ceb4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "provider_model",
        sa.Column("model", sa.String(100), nullable=False)
    )
    op.add_column(
        "provider_model",
        sa.Column("temperature", sa.Float(), nullable=False, server_default="0.7")
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("provider_model", "temperature")
    op.drop_column("provider_model", "model")
