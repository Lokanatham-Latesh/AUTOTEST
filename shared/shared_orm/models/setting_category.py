from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared_orm.db.base import Base
# from app.models.user import User
# XLSX enum: Text, Number, Date, Dropdown, Radio Button, Checkbox


class SettingCategory(Base):
    __tablename__ = "setting_category"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)