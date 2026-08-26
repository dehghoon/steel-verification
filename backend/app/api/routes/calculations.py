from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.api import VerificationRequest, VerificationResponse
from app.models.core_contract import CoreWSectionRequest, CoreWSectionResponse, build_core_response
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
    """Integrated Structural Core v0.3 entry point.

    The same verified engineering engine powers standalone and platform workflows. The
    integration envelope carries stable project/run/member references and returns canonical
    DesignRun, MemberDesignResult and DesignCheck records for 3D Model/report consumers.
    v0.2 request envelopes are accepted during migration but writeback is canonical v0.3.
    """
    calculation = _run(request.verification)
    return build_core_response(request, calculation)
