from sqlalchemy import Column, Integer, String, DateTime, Text, UniqueConstraint
from datetime import datetime
from shared_orm.db.base import Base

class TestCaseCredential(Base):
    """
    Stores AI-generated values for test_data placeholders.

    Unique per (page_id + placeholder_key):
      - All test cases on the same page share the same credential value.
      - Different pages are fully isolated from each other.
      - Empty test_data test cases never touch this table.

    Schema:
        id               INT       PK
        page_id          INT       FK → pages.id
        placeholder_key  STR       e.g. "VALID_EMAIL", "INVALID_PASSWORD"
        value            STR       e.g. "testuser_abc@example.com", "123"
        created_on       DATETIME
    """

    __tablename__ = "test_case_credentials"

    id              = Column(Integer,      primary_key=True, autoincrement=True)
    page_id         = Column(Integer,      nullable=False, index=True)
    placeholder_key = Column(String(255),  nullable=False)   # VARCHAR(255) — MySQL safe
    value           = Column(Text,         nullable=False)    # Text — no length cap on generated values
    created_on      = Column(DateTime,     default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("page_id", "placeholder_key", name="uq_page_placeholder"),
    )