from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from datetime import datetime
from shared_orm.models.function import AppFunction
from shared_orm.models.function_provider_model import FunctionProviderModel
from sqlalchemy import func
from app.schemas.function_schema import FunctionProviderModelResponse

class FunctionService:
    #-------------------------------
    # Get all Functions
    #-------------------------------
    def get_all_functions(
        self,
        db: Session,
    ):
        functions = db.query(AppFunction).all()
        return functions
    
    #-------------------------------
    # Get Function Provider Model By IDs
    #-------------------------------
    def get_function_provider_model_by_ids(
        self,
        function_id: int,
        provider_id: int,
        model_id: int,
        db: Session,
    ):
        function_provider_model = db.query(FunctionProviderModel).filter(
            FunctionProviderModel.function_id == function_id,
            FunctionProviderModel.provider_id == provider_id,
            FunctionProviderModel.provider_model_id == model_id
        ).first()
        if not function_provider_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Function Provider Model not found."
            )
        return function_provider_model
    
    #-------------------------------
    # Update Function Provider Model Prompt By IDs
    #-------------------------------
    def update_function_provider_model_prompt_by_ids(
        self,
        function_id: int,
        provider_id: int,
        model_id: int,
        additional_info: str,
        db: Session,
    ):
        function_provider_model = db.query(FunctionProviderModel).filter(
            FunctionProviderModel.function_id == function_id,
            FunctionProviderModel.provider_id == provider_id,
            FunctionProviderModel.provider_model_id == model_id
        ).first()
        if not function_provider_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Function Provider Model not found."
            )
        function_provider_model.additional_info = additional_info
        db.commit()
        db.refresh(function_provider_model)

        return FunctionProviderModelResponse(
            id=function_provider_model.id,
            function_id=function_provider_model.function_id,
            function_name=function_provider_model.function.title,
            provider_id=function_provider_model.provider_id,
            provider_title=function_provider_model.provider.title,
            model_id=function_provider_model.provider_model_id,
            model_title=function_provider_model.provider_model.title,
            additional_info=function_provider_model.additional_info,
        )
