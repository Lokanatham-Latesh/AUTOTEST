from pydantic import BaseModel
from typing import List, Optional

class SiteAttributeItem(BaseModel):
    attribute_key: str
    attribute_title: str

class SiteAttributeBulkCreate(BaseModel):
    site_id: int
    attributes: List[SiteAttributeItem]


class SiteAttributeUpdate(BaseModel):
    attribute_key: Optional[str] = None
    attribute_title: Optional[str] = None


class SiteAttributeResponse(BaseModel):
    id: int
    site_id: int
    attribute_key: str
    attribute_title: str

    class Config:
        from_attributes = True

class SiteAttributeBulkResponse(BaseModel):
    items: List[SiteAttributeResponse]
    total: int

class SiteAttributeDelete(BaseModel):
    id: int
