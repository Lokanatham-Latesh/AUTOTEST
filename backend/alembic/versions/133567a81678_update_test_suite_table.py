"""update test suite table

Revision ID: 133567a81678
Revises: 14105b0870d6
Create Date: 2026-03-25 16:24:33.426408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '133567a81678'
down_revision: Union[str, Sequence[str], None] = '14105b0870d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "test_suite",
        sa.Column("description", sa.String(200), nullable=False)
    )
    op.add_column(
        "test_suite",
        sa.Column("status", sa.Enum('draft', 'ready', 'running', 'done', 'failed'), nullable=False)
    )
    op.add_column(
        "test_suite",
        sa.Column("flow_definition", sa.JSON(), nullable=False),
    )
    op.add_column(
        "test_suite",
        sa.Column("updated_on", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "test_suite",
        sa.Column("updated_by", sa.Integer(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("test_suite", "description")
    op.drop_column("test_suite", "status")
    op.drop_column("test_suite", "flow_definition")
    op.drop_column("test_suite", "updated_on")
    op.drop_column("test_suite", "updated_by")