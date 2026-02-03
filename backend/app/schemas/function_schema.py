from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class FunctionProviderModelResponse(BaseModel):
    id: int
    function_id: int
    provider_id: int
    provider_model_id: int
    additional_info: str

    model_config = {"from_attributes": True}