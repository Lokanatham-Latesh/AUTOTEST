from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc
from datetime import datetime
from shared_orm.models.setting_category import SettingCategory
from shared_orm.models.setting import Setting
from sqlalchemy import func

from shared_orm.models.test_case import TestCase
from shared_orm.models.test_scenario import TestScenario
from app.schemas.setting_schema import SettingResponse

class SettingService:
    def get_setting_by_category(
        self,
        setting_category_id: int,
        db: Session,
    ):
        settings = db.query(Setting).filter(Setting.setting_category_id == setting_category_id).all()
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No settings found for the given category."
            )
        return settings
    
    def get_all_setting_categories(
        self,
        db: Session,
    ):
        categories = db.query(SettingCategory).all()
        return categories
    
    def get_setting_category_by_id(
        self,
        setting_category_id: int,
        db: Session,
    ):
        category = db.query(SettingCategory).filter(SettingCategory.id == setting_category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting category not found."
            )
        return category
    
    def get_setting_by_id(
        self,
        setting_id: int,
        db: Session,
    ):
        setting = db.query(Setting).filter(Setting.id == setting_id).first()
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found."
            )
        return setting
    
    def get_all_settings(
        self,
        db: Session,
    ):
        settings = db.query(Setting).all()
        return settings

    def update_actual_value(
        self,
        setting_id: int,
        actual_value: str,
        db: Session,
    ):
        setting = db.query(Setting).filter(Setting.id == setting_id).first()

        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )

        setting.actual_value = actual_value
        db.commit()
        db.refresh(setting)

        return setting
    def update_actual_values_by_category(
        self,
        setting_category_id: int,
        updates: list,
        db: Session,
        updated_by_user_id: int,
    ):
        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No settings provided for update."
            )

        settings = (
            db.query(Setting)
            .filter(Setting.setting_category_id == setting_category_id)
            .all()
        )

        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No settings found for this category."
            )

        settings_map = {s.id: s for s in settings}

        for item in updates:
            if item.id not in settings_map:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Setting ID {item.id} does not belong to this category."
                )

        try:
            for item in updates:
                setting = settings_map[item.id]
                setting.actual_value = item.actual_value
                setting.updated_by = updated_by_user_id
                setting.updated_on = datetime.utcnow()
                

            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update settings."
            )

        return list(settings_map.values())
