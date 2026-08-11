from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.models.api import ReportPreviewRequest, ReportPreviewResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/preview", response_model=ReportPreviewResponse)
def preview(request: ReportPreviewRequest) -> ReportPreviewResponse:
    calculation = request.calculation
    return ReportPreviewResponse(
        status="preview",
        title="Steel W-Section Verification",
        sections=[
            {"name": "Project Information", "data": request.project},
            {"name": "Inputs", "data": calculation.normalized_inputs},
            {"name": "Engineering Checks", "data": calculation.utilization_ratios},
            {"name": "Governing Check", "data": {
                "check": calculation.governing_check,
                "status": calculation.overall_status,
            }},
            {"name": "Warnings", "data": calculation.warnings},
            {"name": "Code References", "data": calculation.code_reference_ids},
        ],
        official_download_available=False,
        limitation="Official PDF rendering remains disabled until the approved tool-specific Report Specification and entitlement integration are configured.",
    )


@router.post("/official")
def official_report() -> None:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "REPORT_ENTITLEMENT_REQUIRED",
            "message": "Official PDF generation is disabled until server-side authentication, entitlement, and the approved Report Specification are configured.",
        },
    )
