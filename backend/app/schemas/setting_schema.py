
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SettingResponse(BaseModel):
    id: int
    title: str

class SettingCategoryResponse(BaseModel):
    id: int
    title: str

class SettingUpdateActualValue(BaseModel):
    actual_value: str


class SettingUpdateItem(BaseModel):
    id: int
    actual_value: Optional[str]

class BulkSettingUpdateRequest(BaseModel):
    settings: List[SettingUpdateItem]

class SettingResponse(BaseModel):
    id: int
    key: str
    title: str
    description: Optional[str]
    type: str
    possible_values: Optional[str]
    default_value: Optional[str]
    actual_value: Optional[str]
    setting_category_id: int
    updated_on: Optional[datetime]
    updated_by: Optional[int]

    class Config:
        from_attributes = True
