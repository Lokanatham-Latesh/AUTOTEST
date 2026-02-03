from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.middleware.auth_middleware import auth_required
from app.schemas.function_schema import FunctionProviderModelResponse
from app.services.function_service import FunctionService
from shared_orm.models.user import User

router = APIRouter(prefix="/functions", tags=["Functions"])
function_service = FunctionService()

#-------------------------------
# Get All Providers
#-------------------------------
@router.get(
    "/all",
    summary="Get all functions",
    description="Retrieve a list of all functions."
)
def get_all_functions(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return function_service.get_all_functions(db=db)


#-------------------------------
# Get Prompt By Function ID, API Provider ID, and Model ID
#-------------------------------
@router.get(
    "/{function_id}/{provider_id}/{model_id}",
    # response_model=FunctionProviderModelResponse,
    summary="Get prompt by function provider model by IDs",
    description="Retrieve a specific function provider model using its IDs."
)
def get_function_provider_model_by_ids(
    function_id: int,
    provider_id: int,
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return function_service.get_function_provider_model_by_ids(
        function_id=function_id,
        provider_id=provider_id,
        model_id=model_id,
        db=db
    )

#-------------------------------
# Update Prompt by Function ID, API Provider ID, and Model ID
#-------------------------------
@router.put(
    "/{function_id}/{provider_id}/{model_id}",
    response_model=FunctionProviderModelResponse,
    summary="Update prompt by function provider model by IDs",
    description="Update a specific function provider model's prompt using its IDs."
)
def update_function_provider_model_prompt_by_ids(
    function_id: int,
    provider_id: int,
    model_id: int,
    additional_info: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return function_service.update_function_provider_model_prompt_by_ids(
        function_id=function_id,
        provider_id=provider_id,
        model_id=model_id,
        additional_info=additional_info,
        db=db
    )
