from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from datetime import datetime
from shared_orm.models.provider import Provider
from shared_orm.models.provider_model import ProviderModel
from sqlalchemy import func
from app.schemas.provider_schema import ProviderResponse
from app.schemas.provider_model_schema import ProviderModelResponse, ProviderModelUpdateRequest

class ProviderService:
    #-------------------------------
    # Get all Providers
    #-------------------------------
    def get_all_providers(
        self,
        db: Session,
    ):
        providers = db.query(Provider).all()
        return providers
    
    #-------------------------------
    # Get Provider By ID
    #-------------------------------
    def get_provider_by_id(
        self,
        provider_id: int,
        db: Session,
    ):
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found."
            )
        return provider
    
    #-------------------------------
    # Save / Update Provider
    #-------------------------------
    def update_provider(
        self,
        provider_id: int,
        key: str,
        is_active: bool,
        db: Session,
    ):
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found."
            )
        provider.key = key
        provider.is_active = is_active
        db.commit()
        db.refresh(provider)
        return provider
    
    #-------------------------------
    # Get all Provider Models
    #-------------------------------
    def get_all_providers_models(
        self,
        db: Session,
    ):
        provider_models = db.query(ProviderModel).all()
        return provider_models
    
    #-------------------------------
    # Get Provider Model By ID
    #-------------------------------
    def get_provider_model_by_id(
        self,
        db: Session,
        model_id: int,
    ):
        provider_model = db.query(ProviderModel).filter(ProviderModel.id == model_id).first()
        if not provider_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider Model not found."
            )
        return provider_model

    #-------------------------------
    # Save / Update Provider Model Bulk
    #-------------------------------
    def update_provider_models(
        self,
        provider_id: int,
        payload: list[ProviderModelUpdateRequest],
        updated_by: int,
        db: Session,
    ):
        updated_models = []

        for item in payload:
            provider_model = (
                db.query(ProviderModel)
                .filter(
                    ProviderModel.id == item.id,
                    ProviderModel.provider_id == provider_id
                )
                .first()
            )

            if not provider_model:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Provider model {item.id} not found for provider {provider_id}"
                )

            if item.prompt is not None:
                provider_model.prompt = item.prompt

            if item.model is not None:
                provider_model.model = item.model

            if item.temperature is not None:
                provider_model.temperature = item.temperature

            provider_model.updated_by = updated_by
            provider_model.updated_on = datetime.utcnow()

            updated_models.append(provider_model)

        db.commit()

        for model in updated_models:
            db.refresh(model)

        return updated_models

    #-------------------------------
    # Get Provider Models By Provider ID
    #-------------------------------
    def get_provider_models_by_provider_id(
        self,
        provider_id: int,
        db: Session,
    ):
        provider = db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found."
            )
        
        provider_models = (
            db.query(ProviderModel)
            .filter(ProviderModel.provider_id == provider_id)
            .all()
        )
        
        return {
            "providerId": provider.id,
            "providerTitle": provider.title,
            "models": [
                {
                    "id": model.id,
                    "title": model.title,
                    "model": model.model,
                    "temperature": model.temperature,
                    "prompt": model.prompt,
                }
                for model in provider_models
            ],
        }