from fastapi import APIRouter, Depends, Query,Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.middleware.auth_middleware import auth_required
from shared_orm.models.user import User
from app.services.scenario_service import ScenarioService
from app.schemas.scenarios_schema import PaginatedScenarioResponse,ScenarioDetailResponse

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

scenario_service = ScenarioService()


@router.get("", response_model=PaginatedScenarioResponse)
def list_scenarios(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    site_id: int | None = Query(None),
    page_id: int | None = Query(None),
    search: str | None = Query(None),
    sort: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    total, scenarios = scenario_service.list_scenarios(
        db=db,
        page=page,
        limit=limit,
        site_id=site_id,
        page_id=page_id,
        search=search,
        sort=sort,
        user=current_user
    )

    return {
        "data": scenarios,
        "page": page,
        "limit": limit,
        "total": total
    }

@router.get("/{scenario_id}", response_model=ScenarioDetailResponse)
def get_scenario_details(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_required),
):
    return scenario_service.get_scenario_details(
        db=db,
        scenario_id=scenario_id
    )

