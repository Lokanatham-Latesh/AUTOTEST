from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ProviderModelResponse(BaseModel):
    id: int
    provider_id: int
    title: str
    prompt: Optional[str]
    created_on: Optional[datetime]
    updated_on: Optional[datetime]
    created_by: Optional[int]
    updated_by: Optional[int]

    class Config:
        from_attributes = True


class ProviderModelUpdate(BaseModel):
    id: Optional[int] = None
    provider_id: Optional[int] = None
    title: Optional[str] = None
    prompt: Optional[str] = None
    updated_by: Optional[int] = None
    updated_on: Optional[datetime] = None