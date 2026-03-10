from pydantic import BaseModel
from datetime import datetime


class TestExecutionResponse(BaseModel):
    id: int
    status: str | None
    logs: str | None
    executed_on: datetime | None

    class Config:
        from_attributes = True