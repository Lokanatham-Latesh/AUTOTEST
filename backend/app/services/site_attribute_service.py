from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from shared_orm.models.site_attribute import SiteAttribute
from shared_orm.models.site import Site
from app.schemas.site_attribute_schema import SiteAttributeBulkCreate, SiteAttributeUpdate
from shared_orm.models.user import User


class SiteAttributeService:

    def create_bulk_site_attributes(self, data: SiteAttributeBulkCreate, db: Session, user: User) -> list[SiteAttribute]:
        site = db.query(Site).filter(Site.id == data.site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site {data.site_id} not found"
            )

        records = [
            SiteAttribute(
                site_id=data.site_id,
                attribute_key=item.attribute_key,
                attribute_title=item.attribute_title,
            )
            for item in data.attributes
        ]

        db.add_all(records)
        db.commit()
        for r in records:
            db.refresh(r)

        return records

    def update_site_attribute(self, attribute_id: int, data: SiteAttributeUpdate, db: Session, user: User) -> SiteAttribute:
        attribute = db.query(SiteAttribute).filter(SiteAttribute.id == attribute_id).first()
        if not attribute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site attribute {attribute_id} not found"
            )

        if data.attribute_key is not None:
            attribute.attribute_key = data.attribute_key
        if data.attribute_title is not None:
            attribute.attribute_title = data.attribute_title

        db.commit()
        db.refresh(attribute)
        return attribute
    
    def delete_site_attribute(self, attribute_id: int, db: Session, user: User) -> None:
        attribute = db.query(SiteAttribute).filter(SiteAttribute.id == attribute_id).first()
        if not attribute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site attribute {attribute_id} not found"
            )

        db.delete(attribute)
        db.commit()
    
    def get_site_attributes_by_site_id(self, site_id: int, db: Session, user: User) -> list[SiteAttribute]:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site {site_id} not found"
            )

        return db.query(SiteAttribute).filter(SiteAttribute.site_id == site_id).all()
    
    def get_site_attribute_by_id(self, attribute_id: int, db: Session, user: User) -> SiteAttribute:
        attribute = db.query(SiteAttribute).filter(SiteAttribute.id == attribute_id).first()
        if not attribute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site attribute {attribute_id} not found"
            )
        return attribute
    
    def get_site_attribute_by_key(self, site_id: int, attribute_key: str, db: Session, user: User) -> SiteAttribute:
        site = db.query(Site).filter(Site.id == site_id).first()
        if not site:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site {site_id} not found"
            )

        attribute = db.query(SiteAttribute).filter(
            SiteAttribute.site_id == site_id,
            SiteAttribute.attribute_key == attribute_key
        ).first()

        if not attribute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Site attribute with key '{attribute_key}' not found for site {site_id}"
            )

        return attribute