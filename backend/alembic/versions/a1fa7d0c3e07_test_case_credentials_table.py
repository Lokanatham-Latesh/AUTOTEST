"""test_case_credentials_table

Revision ID: a1fa7d0c3e07
Revises: c81e551585eb
Create Date: 2026-02-17 18:44:08.601115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1fa7d0c3e07'
down_revision: Union[str, Sequence[str], None] = 'c81e551585eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "test_case_credentials",

        sa.Column("id",              sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column("page_id",         sa.Integer(),     nullable=False),
        sa.Column("placeholder_key", sa.String(255),   nullable=False),  # e.g. "VALID_EMAIL"
        sa.Column("value",           sa.Text(),        nullable=False),   # Text — no length cap on generated values
        sa.Column("created_on",      sa.DateTime(),    nullable=True),

        sa.UniqueConstraint("page_id", "placeholder_key", name="uq_page_placeholder"),
    )

    # Index on page_id for fast scoped lookups
    op.create_index(
        "ix_test_case_credentials_page_id",
        "test_case_credentials",
        ["page_id"]
    )




def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_test_case_credentials_page_id", table_name="test_case_credentials")
    op.drop_table("test_case_credentials")