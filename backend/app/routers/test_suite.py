from fastapi import APIRouter, Depends, Query, Path, status, Response
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middleware.auth_middleware import auth_required
from shared_orm.models.user import User
from app.services.test_suite_service import TestSuiteService
from app.schemas.test_suite_schema import (
    TestSuiteCreate,
    TestSuiteUpdate,
    TestSuiteResponse,
    TestSuiteListResponse,
)

router = APIRouter(prefix="/test-suites", tags=["Test Suites"])
test_suite_service = TestSuiteService()


@router.get("", response_model=TestSuiteListResponse)
def list_test_suites(
    site_id: int = Query(..., description="Filter by site ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    total, items = test_suite_service.list_test_suites(
        db=db, site_id=site_id, page=page, limit=limit, user=current_user
    )
    return {"items": items, "total": total}


@router.post("", response_model=TestSuiteResponse, status_code=status.HTTP_201_CREATED)
def create_test_suite(
    payload: TestSuiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    return test_suite_service.create_test_suite(
        db=db, payload=payload.model_dump(), user=current_user
    )


@router.get("/{suite_id}", response_model=TestSuiteResponse)
def get_test_suite(
    suite_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    return test_suite_service.get_test_suite(db=db, suite_id=suite_id, user=current_user)


@router.put("/{suite_id}", response_model=TestSuiteResponse)
def update_test_suite(
    payload: TestSuiteUpdate,
    suite_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    return test_suite_service.update_test_suite(
        db=db, suite_id=suite_id, payload=payload.model_dump(exclude_unset=True), user=current_user
    )


@router.delete("/{suite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test_suite(
    suite_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    test_suite_service.delete_test_suite(db=db, suite_id=suite_id, user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
