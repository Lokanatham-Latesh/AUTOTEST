from pydantic import BaseModel , Field
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

class TestCaseBase(BaseModel):
    title: str = Field(..., max_length=200)
    type: Optional[str] = "auto-generated"
    data: Optional[Dict] = None
    expected_outcome: Optional[Dict] = None
    validation: Optional[Dict] = None
    is_valid: Optional[bool] = True
    is_valid_default: Optional[bool] = False

class CreateTestCaseRequest(TestCaseBase):
    test_scenario_id: int

class TestCaseResponse(BaseModel):
    id: int
    title: str
    type: str
    data: Optional[Dict]
    expected_outcome: Optional[Dict]
    validation: Optional[Dict]
    is_valid: bool
    is_valid_default: bool
    created_on: Optional[datetime]
    updated_on: Optional[datetime]

    class Config:
        from_attributes = True

