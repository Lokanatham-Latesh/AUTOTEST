from __future__ import annotations
from datetime import datetime
from sqlalchemy import JSON, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.shared_orm.models.site import Site
from shared_orm.db.base import Base
# from app.models.site import Site

class TestSuiteStep(Base):
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_suite_id: Mapped[int] = mapped_column(ForeignKey("test_suite.id"), nullable=False, index=True)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    node_id: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(50), nullable=False)
    page_id: Mapped[int] = mapped_column(ForeignKey("page.id"), nullable=False)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("test_scenario.id"), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)