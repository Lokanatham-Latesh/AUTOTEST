from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.shared_orm.models.user import User
from shared_orm.db.base import Base

class Provider(Base):
    __tablename__ = "provider"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)

    key: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"), nullable=True
    )
    created_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"), nullable=True
    )
    updated_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    creator: Mapped["User | None"] = relationship(
        "User", foreign_keys=[created_by]
    )
    updater: Mapped["User | None"] = relationship(
        "User", foreign_keys=[updated_by]
    )
