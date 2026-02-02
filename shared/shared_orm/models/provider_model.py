from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared_orm.db.base import Base

class ProviderModel(Base):
    __tablename__ = "provider_model"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    provider_id: Mapped[int] = mapped_column(
        ForeignKey("provider.id", ondelete="RESTRICT"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )

    prompt: Mapped[str | None] = mapped_column(
        String(5000), nullable=True
    )

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"), nullable=True
    )

    created_on: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )

    updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"), nullable=True
    )

    updated_on: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # 🔗 Relationships
    provider: Mapped["Provider"] = relationship(
        "Provider", back_populates="models"
    )

    creator: Mapped["User | None"] = relationship(
        "User", foreign_keys=[created_by]
    )

    updater: Mapped["User | None"] = relationship(
        "User", foreign_keys=[updated_by]
    )
