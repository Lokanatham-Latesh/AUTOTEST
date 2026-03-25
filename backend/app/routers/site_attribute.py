from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.site_attribute_schema import (
    SiteAttributeBulkCreate,
    SiteAttributeUpdate,
    SiteAttributeResponse,
    SiteAttributeBulkResponse
)
from app.services.site_attribute_service import SiteAttributeService
from app.middleware.auth_middleware import auth_required
from shared_orm.models.user import User

site_attribute_service = SiteAttributeService()
router = APIRouter(
    prefix="/site-attributes",
    tags=["Site Attributes"]
)

## Create site attributes in bulk
@router.post(
    "",
    response_model=SiteAttributeBulkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new site attributes",
    description="Create new site attributes in bulk for the authenticated user."
)
def create_bulk_site_attributes(
    data: SiteAttributeBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    records = site_attribute_service.create_bulk_site_attributes(data, db, current_user)
    return SiteAttributeBulkResponse(items=records, total=len(records))

## Update site attribute
@router.put(
    "/{attribute_id}",
    response_model=SiteAttributeResponse,
    summary="Update a site attribute",
    description="Update an existing site attribute for the authenticated user."
)
def update_site_attribute(
    attribute_id: int,
    data: SiteAttributeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return site_attribute_service.update_site_attribute(attribute_id, data, db, current_user)

## Delete site attribute
@router.delete(
    "/{attribute_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a site attribute",
    description="Delete an existing site attribute for the authenticated user."
)
def delete_site_attribute(
    attribute_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    site_attribute_service.delete_site_attribute(attribute_id, db, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

## Get site attributes by site ID
@router.get(
    "/site/{site_id}",
    response_model=SiteAttributeBulkResponse,
    summary="Get attributes for a site",
    description="Retrieve all attributes for a specific site."
)
def get_site_attributes(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    records = site_attribute_service.get_site_attributes_by_site_id(site_id, db, current_user)
    return SiteAttributeBulkResponse(items=records, total=len(records))

## Get site attribute by site ID and key
@router.get(
    "/site/{site_id}/key/{attribute_key}",
    response_model=SiteAttributeResponse,
    summary="Get a site attribute by site ID and key",
    description="Retrieve a specific site attribute by site ID and attribute key."
)
def get_site_attribute_by_key(
    site_id: int,
    attribute_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return site_attribute_service.get_site_attribute_by_key(site_id, attribute_key, db, current_user)

## Get site attribute by ID
@router.get(
    "/{attribute_id}",
    response_model=SiteAttributeResponse,
    summary="Get a site attribute by ID",
    description="Retrieve details of a specific site attribute by its ID."
)
def get_site_attribute(
    attribute_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required)
):
    return site_attribute_service.get_site_attribute_by_id(attribute_id, db, current_user)
