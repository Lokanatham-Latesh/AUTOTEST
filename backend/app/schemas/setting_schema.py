
from pydantic import BaseModel

class SettingResponse(BaseModel):
    id: int
    title: str

class SettingCategoryResponse(BaseModel):
    id: int
    title: str

class SettingUpdateActualValue(BaseModel):
    actual_value: str