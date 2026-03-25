from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TestSuiteStepCreate(BaseModel):
    test_suite_id: int
    step_number: int
    node_id: int
    label: str
    page_id: int
    scenario_id: int
    step_order: int


class TestSuiteStepDelete(BaseModel):
    id: int


class TestSuiteStepResponse(BaseModel):
    id: int
    test_suite_id: int
    step_number: int
    node_id: int
    label: str
    page_id: int
    scenario_id: int
    step_order: int
    created_on: Optional[datetime] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class TestSuiteStepListResponse(BaseModel):
    items: List[TestSuiteStepResponse]
    total: int
