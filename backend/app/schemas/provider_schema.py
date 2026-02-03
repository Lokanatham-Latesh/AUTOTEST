from pydantic import BaseModel
from datetime import datetime

class ProviderResponse(BaseModel):
    id: int
    title: str
    key: str
    is_active: bool
    created_on: datetime | None

    class Config:
        from_attributes = True   # VERY IMPORTANT for ORM