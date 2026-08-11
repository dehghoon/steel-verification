from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.api import VerificationRequest, VerificationResponse
from app.services.calculation import InputValidationError, run_verification
from app.services.cisc import CiscDatasetService

router = APIRouter(prefix="/calculations", tags=["calculations"])


@router.post("/w-section", response_model=VerificationResponse)
def calculate(request: VerificationRequest) -> VerificationResponse:
    try:
        return run_verification(request, CiscDatasetService(settings.cisc_dataset_path))
    except InputValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "ENGINEERING_INPUT_INVALID", "message": str(exc)},
        ) from exc
