from sqlalchemy import Column, Integer, String, DateTime, func
from shared_orm.db.base import Base

class AppFunction(Base):
    __tablename__ = 'function'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    prompt = Column(String(5000), nullable=True)

    created_by = Column(Integer, nullable=True)
    created_on = Column(DateTime, nullable=False, server_default=func.now())

    updated_by = Column(Integer, nullable=True)
    updated_on = Column(DateTime, nullable=True)

    # def __repr__(self):
    #     return f"<Function(id={self.id}, title='{self.title}')>"
