from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from shared_orm.db.base import Base

class FunctionProviderModel(Base):
    __tablename__ = 'function_provider_model'

    id = Column(Integer, primary_key=True)

    function_id = Column(
        Integer,
        ForeignKey('function.id', ondelete='RESTRICT'),
        nullable=False
    )
    provider_id = Column(
        Integer,
        ForeignKey('provider.id', ondelete='RESTRICT'),
        nullable=False
    )
    provider_model_id = Column(
        Integer,
        ForeignKey('provider_model.id', ondelete='RESTRICT'),
        nullable=False
    )

    additional_info = Column(String(5000), nullable=True)

    created_by = Column(Integer, nullable=True)
    created_on = Column(DateTime, nullable=False, server_default=func.now())

    updated_by = Column(Integer, nullable=True)
    updated_on = Column(DateTime, nullable=True)

    # Optional relationships (recommended)
    function = relationship("AppFunction", lazy="joined")
    provider = relationship("Provider", lazy="joined")
    provider_model = relationship("ProviderModel", lazy="joined")

    def __repr__(self):
        return (
            f"<FunctionProviderModel("
            f"id={self.id}, "
            f"function_id={self.function_id}, "
            f"provider_id={self.provider_id}, "
            f"provider_model_id={self.provider_model_id})>"
        )
