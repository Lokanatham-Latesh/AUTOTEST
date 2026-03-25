from __future__ import annotations
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from shared_orm.db.base import Base


class SiteAttribute(Base):
    __tablename__ = "site_attribute"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("site.id"), nullable=False, index=True)
    attribute_key: Mapped[str] = mapped_column(String(50), nullable=False)
    attribute_title: Mapped[str] = mapped_column(String(200), nullable=False)
