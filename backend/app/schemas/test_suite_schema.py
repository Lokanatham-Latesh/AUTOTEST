from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime


class TestSuiteCreate(BaseModel):
    site_id: int
    title: str
    description: str
    status: str
    flow_definition: Dict[str, Any]
    scenario_count: Optional[int] = None
    test_case_count: Optional[int] = None


class TestSuiteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    flow_definition: Optional[Dict[str, Any]] = None
    scenario_count: Optional[int] = None
    test_case_count: Optional[int] = None


class TestSuiteResponse(BaseModel):
    id: int
    site_id: int
    title: str
    description: str
    status: str
    flow_definition: Dict[str, Any]
    scenario_count: Optional[int] = None
    test_case_count: Optional[int] = None
    created_on: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_on: Optional[datetime] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


class TestSuiteListResponse(BaseModel):
    items: List[TestSuiteResponse]
    total: int
