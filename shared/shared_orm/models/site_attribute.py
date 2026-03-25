from __future__ import annotations
from datetime import datetime
from sqlalchemy import JSON, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.shared_orm.models.site import Site
from shared_orm.db.base import Base

class SiteAttribute(Base):
    
    from __future__ import annotations
from datetime import datetime
from sqlalchemy import JSON, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.shared_orm.models.site import Site
from shared_orm.db.base import Base

class TestSuiteExecutionAttribute(Base):
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_id: Mapped[int] = mapped_column(Integer, nullable=False)
    attribute_key: Mapped[str] = mapped_column(String(50), nullable=False)
    attribute_title: Mapped[str] = mapped_column(String(200), nullable=False)


