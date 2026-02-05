from datetime import datetime
from pydantic import BaseModel,Field
from typing import Optional


class FunctionProviderModelUpsertRequest(BaseModel):
    function_id: int = Field(..., example=1)
    provider_id: int = Field(..., example=1)
    provider_model_id: int = Field(..., example=4)
    additional_info: Optional[str] = Field(
        None,
        example="<p>Analyze the page structure...</p>",
        description="Prompt or additional configuration info",
    )

class FunctionProviderModelResponse(BaseModel):
    id: int
    function_id: int
    provider_id: int
    provider_model_id: int
    additional_info: Optional[str]

    created_by: Optional[int]
    created_on: datetime
    updated_by: Optional[int]
    updated_on: Optional[datetime]

    model_config = {"from_attributes": True}

    