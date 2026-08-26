from fastapi import APIRouter

from app.models.api import ReportPreviewRequest, ReportPreviewResponse

router = APIRouter(prefix="/reports", tags=["reports"])


def _build_report(request: ReportPreviewRequest) -> ReportPreviewResponse:
    calculation = request.calculation
    report_request_id = request.report_request_id or "preview-report"
    canonical_sections = [
        {"id": "project", "type": "project", "title": "Project Information", "data": request.project},
        {"id": "inputs", "type": "model", "title": "Inputs", "data": calculation.normalized_inputs},
        {"id": "design", "type": "design", "title": "Engineering Checks", "data": calculation.utilization_ratios},
        {"id": "governing", "type": "design", "title": "Governing Check", "data": {"check": calculation.governing_check, "status": calculation.overall_status}},
        {"id": "warnings", "type": "warnings", "title": "Warnings", "data": calculation.warnings},
        {"id": "references", "type": "references", "title": "Code References", "data": calculation.code_reference_ids},
    ]
    canonical_report = {
        "id": f"{report_request_id}:record",
        "requestId": report_request_id,
        "status": "warning" if calculation.warnings else "ok",
        "title": "Steel W-Section Verification",
        "sections": canonical_sections,
        "warnings": calculation.warnings,
        "sourceIds": [value for value in [request.design_run_id, request.member_id] if value],
        "modelSchemaVersion": "0.3",
    }
    return ReportPreviewResponse(
        status="preview",
        title="Steel W-Section Verification",
        sections=[{"name": item["title"], "data": item["data"]} for item in canonical_sections],
        official_download_available=True,
        limitation="Temporary development mode: report entitlement/authentication is bypassed for review. PDF rendering is not yet implemented.",
        canonical_report=canonical_report,
    )


@router.post("/preview", response_model=ReportPreviewResponse)
def preview(request: ReportPreviewRequest) -> ReportPreviewResponse:
    return _build_report(request)


@router.post("/official", response_model=ReportPreviewResponse)
def official_report(request: ReportPreviewRequest) -> ReportPreviewResponse:
    # TEMPORARY DEVELOPMENT BYPASS: restore entitlement/auth checks before production release.
    return _build_report(request)
