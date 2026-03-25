from pydantic import BaseModel
from typing import List, Optional


class TestSuiteExecutionAttributeCreate(BaseModel):
    site_id: int
    test_suite_execution_id: int
    site_attribute_key: str
    site_attribute_value: Optional[str] = None


class TestSuiteExecutionAttributeDelete(BaseModel):
    id: int


class TestSuiteExecutionAttributeResponse(BaseModel):
    id: int
    site_id: int
    test_suite_execution_id: int
    site_attribute_key: str
    site_attribute_value: Optional[str] = None

    class Config:
        from_attributes = True


class TestSuiteExecutionAttributeListResponse(BaseModel):
    items: List[TestSuiteExecutionAttributeResponse]
    total: int
