from fastapi import APIRouter

from app.models.api import ReportPreviewRequest, ReportPreviewResponse

router = APIRouter(prefix="/reports", tags=["reports"])


def _build_report(request: ReportPreviewRequest, status: str) -> ReportPreviewResponse:
    calculation = request.calculation
    return ReportPreviewResponse(
        status=status,
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
        official_download_available=True,
        limitation="Temporary development mode: report entitlement/authentication is bypassed for review. PDF rendering is not yet implemented.",
    )


@router.post("/preview", response_model=ReportPreviewResponse)
def preview(request: ReportPreviewRequest) -> ReportPreviewResponse:
    return _build_report(request, "preview")


@router.post("/official", response_model=ReportPreviewResponse)
def official_report(request: ReportPreviewRequest) -> ReportPreviewResponse:
    # TEMPORARY DEVELOPMENT BYPASS: restore entitlement/auth checks before production release.
    return _build_report(request, "official-preview")
