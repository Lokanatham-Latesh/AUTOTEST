from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ScenarioListItem(BaseModel):
    id: int
    title: str
    type: str
    category: str | None
    test_case_count: int

class PaginatedScenarioResponse(BaseModel):
    data: List[ScenarioListItem]
    page: int
    limit: int
    total: int

class TestCaseDetailResponse(BaseModel):
    id: int
    title: str
    type: str
    is_valid: bool
    is_valid_default: bool


class ScenarioDetailResponse(BaseModel):
    id: int
    title: str
    type: str
    category: str | None
    created_on: datetime | None
    data: Optional[Dict[str, Any]]
    test_cases: List[TestCaseDetailResponse]
