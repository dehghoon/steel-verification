from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.api import VerificationRequest, VerificationResponse
from app.models.core_contract import CoreWSectionRequest, CoreWSectionResponse, build_core_response
from app.models.core_contract_v05 import (
    CoreWSectionV05Request,
    CoreWSectionV05Response,
    build_core_v05_response,
)
from app.services.calculation import InputValidationError, run_verification
from app.services.cisc import CiscDatasetService

router = APIRouter(prefix="/calculations", tags=["calculations"])


def _run(request: VerificationRequest) -> VerificationResponse:
    try:
        return run_verification(request, CiscDatasetService(settings.cisc_dataset_path))
    except InputValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail={"code": "ENGINEERING_INPUT_INVALID", "message": str(exc)},
        ) from exc


@router.post("/w-section", response_model=VerificationResponse)
def calculate(request: VerificationRequest) -> VerificationResponse:
    """Standalone calculator endpoint used by the existing W-section page."""
    return _run(request)


@router.post("/w-section/core", response_model=CoreWSectionResponse)
def calculate_from_core(request: CoreWSectionRequest) -> CoreWSectionResponse:
    """Legacy Core compatibility endpoint retained during the v0.5 migration."""
    calculation = _run(request.verification)
    return build_core_response(request, calculation)


@router.post("/w-section/core/v0.5", response_model=CoreWSectionV05Response)
def calculate_from_core_v05(request: CoreWSectionV05Request) -> CoreWSectionV05Response:
    """Canonical Linkoteq Structural Core v0.5 W-section integration endpoint."""
    member_id = request.inputs.memberId
    if member_id not in request.targetIds:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "CORE_TARGET_ID_MISMATCH",
                "message": "inputs.memberId must be present in targetIds.",
            },
        )

    calculation = _run(request.inputs.verification)
    return build_core_v05_response(request, calculation)
