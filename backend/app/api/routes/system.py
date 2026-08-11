from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/version")
def version() -> dict[str, str]:
    return {
        "application": settings.app_name,
        "version": settings.app_version,
        "engineering_engine": "ECS-WSECTION-CSA-S16-2019-001",
        "engineering_specification_version": "0.2",
    }
