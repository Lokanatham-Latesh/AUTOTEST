from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

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


class ProviderModelUpdateResponse(BaseModel):
    id: Optional[int] = None
    provider_id: Optional[int] = None
    title: Optional[str] = None
    model: Optional[str] = None
    prompt: Optional[str] = None
    temperature: Optional[float] = None
    updated_by: Optional[int] = None
    updated_on: Optional[datetime] = None

class ProviderModelUpdateRequest(BaseModel):
    id: int
    model: str
    temperature: float
    prompt: str

class ProviderModelItemResponse(BaseModel):
    id: int
    title: str
    model: str
    temperature: float
    prompt: Optional[str]

    class Config:
        from_attributes = True


class ProviderModelsByProviderResponse(BaseModel):
    providerId: int
    providerTitle: str
    models: List[ProviderModelItemResponse]