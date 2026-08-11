from fastapi import APIRouter, Query

from app.core.config import settings
from app.models.api import SectionListResponse, SectionRecord
from app.services.cisc import CiscDatasetService

router = APIRouter(prefix="/sections", tags=["sections"])


def service() -> CiscDatasetService:
    return CiscDatasetService(settings.cisc_dataset_path)


@router.get("", response_model=SectionListResponse)
def list_sections(
    query: str | None = None,
    family: str | None = "W",
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> SectionListResponse:
    items, total, version = service().list_sections(query, family, limit, offset)
    return SectionListResponse(items=items, total=total, dataset_version=version)


@router.get("/{section_id}", response_model=SectionRecord)
def get_section(section_id: str, designation: str, dataset_version: str) -> SectionRecord:
    return service().get_section(section_id, designation, dataset_version)
