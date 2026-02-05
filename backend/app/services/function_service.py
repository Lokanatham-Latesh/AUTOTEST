from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from datetime import datetime
from shared_orm.models.function import AppFunction
from shared_orm.models.function_provider_model import FunctionProviderModel
from sqlalchemy import func
from shared_orm.models.user import User
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
        fpm = (
        db.query(FunctionProviderModel)
        .filter(
            FunctionProviderModel.function_id == function_id,
            FunctionProviderModel.provider_id == provider_id,
            FunctionProviderModel.provider_model_id == model_id,
        )
        .first())

        if not fpm:
            return{ 
                "id": None,
                "function_id": function_id,
                "provider_id": provider_id,
                "provider_model_id": model_id,
                "additional_info": None,
                "created_by": None,
                "created_on": None,
                "updated_by": None,
                "updated_on": None,
                }
           
       

        return {
        "id": fpm.id,
        "function_id": fpm.function_id,
        "provider_id": fpm.provider_id,
        "provider_model_id": fpm.provider_model_id,
        "additional_info": fpm.additional_info,
        "created_by": fpm.created_by,
        "created_on": fpm.created_on,
        "updated_by": fpm.updated_by,
        "updated_on": fpm.updated_on,
    }
    
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
        current_user: User
    ):
        function_provider_model = db.query(FunctionProviderModel).filter(
            FunctionProviderModel.function_id == function_id,
            FunctionProviderModel.provider_id == provider_id,
            FunctionProviderModel.provider_model_id == model_id
        ).first()
        now = datetime.utcnow()
        if function_provider_model:
             function_provider_model.additional_info = additional_info
             function_provider_model.updated_by = current_user.id
             function_provider_model.updated_on = now
        else :
            function_provider_model = FunctionProviderModel(
            function_id=function_id,
            provider_id=provider_id,
            provider_model_id=model_id,
            additional_info=additional_info,
            created_by=current_user.id,
            created_on=now,)
            db.add(function_provider_model)
            
        db.commit()
        db.refresh(function_provider_model)
        return {
        "id": function_provider_model.id,
        "function_id": function_provider_model.function_id,
        "provider_id": function_provider_model.provider_id,
        "provider_model_id": function_provider_model.provider_model_id,
        "additional_info": function_provider_model.additional_info,
        "created_by": function_provider_model.created_by,
        "created_on": function_provider_model.created_on,
        "updated_by": function_provider_model.updated_by,
        "updated_on": function_provider_model.updated_on,
        }
    
        
        
