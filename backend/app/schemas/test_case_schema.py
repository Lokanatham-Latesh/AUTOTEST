from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class TestCaseDetailResponse(BaseModel):
    id: int
    title: str
    type: str
    data: Optional[Dict] = None
    expected_outcome: Optional[Dict] = None
    validation: Optional[Dict] = None
    is_valid: bool
    is_valid_default: bool
    created_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None


class UpdateTestCaseRequest(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    data: Optional[Dict] = None
    expected_outcome: Optional[Dict] = None
    validation: Optional[Dict] = None
    is_valid: Optional[bool] = None
    is_valid_default: Optional[bool] = None
