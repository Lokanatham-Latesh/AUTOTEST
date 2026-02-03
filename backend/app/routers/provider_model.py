from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.provider_service import ProviderService
from app.middleware.auth_middleware import auth_required
from app.schemas.provider_model_schema import ProviderModelResponse, ProviderModelUpdate
from shared_orm.models.user import User

router = APIRouter(prefix="/providerModel", tags=["ProviderModel"])
provider_service = ProviderService()

#-------------------------------
# Get All Provider Models
#-------------------------------
@router.get(
    "",
    response_model=list[ProviderModelResponse],
    summary="Get All Provider Models",
    description="Retrieve a list of all provider models."
)
def get_all_provider_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return provider_service.get_all_providers_models(db=db)

#-------------------------------
# Get Provider Model By ID
#-------------------------------
@router.get(
    "/{model_id}",
    response_model=ProviderModelResponse,
    summary="Get provider model by ID",
    description="Retrieve a specific provider model using its ID."
)
def get_provider_model_by_id(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return provider_service.get_provider_model_by_id(
        db=db,
        model_id=model_id
    )

#-------------------------------
# Update Provider Model
#-------------------------------
@router.put(
    "/{provider_model_id}",
    response_model=ProviderModelUpdate,
    summary="Update provider Model",
    description="Update the details of a specific provider model."
)
def update_provider_model(
    provider_model_id: int,
    prompt: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return provider_service.update_provider_model(
        model_id=provider_model_id,
        payload=ProviderModelUpdate(
            prompt=prompt,
            updated_by=current_user.id
        ),
        db=db
    )