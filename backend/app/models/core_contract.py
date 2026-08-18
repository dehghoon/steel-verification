from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from .api import VerificationRequest, VerificationResponse


class CoreWSectionRequest(BaseModel):
    """Integrated W-section verification request used by the 3D/Core workflow.

    The existing standalone `VerificationRequest` and UI stay unchanged. Integrated callers
    identify the Core project/member/run and provide the same validated engineering payload
    that the standalone calculator uses. This keeps one calculation engine and two entry modes.
    """

    model_schema_version: Literal["0.2"] = "0.2"
    project_id: str
    run_id: str
    calculator: Literal["w-section"] = "w-section"
    member_id: str
    analysis_run_id: str | None = None
    load_combination_id: str | None = None
    verification: VerificationRequest


class CoreWSectionResponse(BaseModel):
    modelSchemaVersion: Literal["0.2"] = "0.2"
    projectId: str
    runId: str
    memberId: str
    analysisRunId: str | None = None
    loadCombinationId: str | None = None
    sectionId: str
    designation: str
    status: str
    utilizationRatios: dict[str, float]
    governingCheck: str | None = None
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    calculation: VerificationResponse
    trace: list[dict[str, Any]] = Field(default_factory=list)


def build_core_response(payload: CoreWSectionRequest, calculation: VerificationResponse) -> CoreWSectionResponse:
    return CoreWSectionResponse(
        projectId=payload.project_id,
        runId=payload.run_id,
        memberId=payload.member_id,
        analysisRunId=payload.analysis_run_id,
        loadCombinationId=payload.load_combination_id,
        sectionId=payload.verification.section_id,
        designation=payload.verification.designation,
        status=calculation.overall_status,
        utilizationRatios=calculation.utilization_ratios,
        governingCheck=calculation.governing_check,
        warnings=calculation.warnings,
        errors=calculation.fatal_errors,
        calculation=calculation,
        trace=[
            {"stage": "core_contract", "status": "PASS", "schema_version": payload.model_schema_version},
            {"stage": "analysis_reference", "analysis_run_id": payload.analysis_run_id, "load_combination_id": payload.load_combination_id},
            {"stage": "w_section_verification", "status": calculation.overall_status},
        ],
    )
