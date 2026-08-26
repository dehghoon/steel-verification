from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from .api import VerificationRequest, VerificationResponse


CORE_SCHEMA_VERSION = "0.3"
CALCULATOR_ID = "w-section"
CALCULATOR_VERSION = "1.0"


class CoreWSectionRequest(BaseModel):
    """Integrated W-section request for the Linkoteq Structural Core workflow.

    The standalone VerificationRequest/UI remain unchanged. Integrated callers identify the
    project, run and target member while reusing the exact same verified calculation engine.
    v0.2 requests remain accepted during migration; new callers should emit v0.3.
    """

    model_schema_version: Literal["0.2", "0.3"] = CORE_SCHEMA_VERSION
    project_id: str
    run_id: str
    calculator: Literal["w-section"] = CALCULATOR_ID
    calculator_version: str = CALCULATOR_VERSION
    target_ids: list[str] = Field(default_factory=list)
    member_id: str
    analysis_run_id: str | None = None
    load_combination_id: str | None = None
    verification: VerificationRequest


class CoreDesignCheck(BaseModel):
    id: str
    name: str
    status: Literal["pass", "fail", "warning", "not-checked"]
    utilization: float | None = None
    loadCombinationId: str | None = None
    codeClause: str | None = None
    notes: list[str] = Field(default_factory=list)


class CoreDesignRun(BaseModel):
    id: str
    calculator: str
    calculatorVersion: str
    modelSchemaVersion: Literal["0.3"] = CORE_SCHEMA_VERSION
    targetIds: list[str]
    analysisRunId: str | None = None
    status: Literal["pending", "ok", "warning", "error"]
    code: str | None = None
    codeEdition: str | None = None
    jurisdiction: str | None = None
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)


class CoreMemberDesignResult(BaseModel):
    id: str
    runId: str
    memberId: str
    calculator: str
    calculatorVersion: str
    code: str | None = None
    codeEdition: str | None = None
    status: Literal["pass", "fail", "warning", "not-checked"]
    assignedSectionId: str | None = None
    recommendedSectionId: str | None = None
    governingCheckId: str | None = None
    utilization: float | None = None
    checks: list[CoreDesignCheck]
    warnings: list[str] = Field(default_factory=list)
    trace: list[dict[str, Any]] = Field(default_factory=list)


class CoreWSectionResponse(BaseModel):
    # Canonical v0.3 writeback
    modelSchemaVersion: Literal["0.3"] = CORE_SCHEMA_VERSION
    projectId: str
    runId: str
    calculator: str = CALCULATOR_ID
    calculatorVersion: str = CALCULATOR_VERSION
    targetIds: list[str]
    designRun: CoreDesignRun
    memberDesignResults: list[CoreMemberDesignResult]
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    trace: list[dict[str, Any]] = Field(default_factory=list)

    # Compatibility fields retained for existing 3D/Core consumers during migration.
    memberId: str
    analysisRunId: str | None = None
    loadCombinationId: str | None = None
    sectionId: str
    designation: str
    status: str
    utilizationRatios: dict[str, float]
    governingCheck: str | None = None
    calculation: VerificationResponse


def _design_status(status: str) -> Literal["pass", "fail", "warning", "not-checked"]:
    normalized = status.upper()
    if normalized == "PASS":
        return "pass"
    if normalized == "FAIL":
        return "fail"
    if normalized in {"INDETERMINATE", "WARNING"}:
        return "warning"
    return "not-checked"


def _run_status(calculation: VerificationResponse) -> Literal["pending", "ok", "warning", "error"]:
    if calculation.fatal_errors:
        return "error"
    if calculation.overall_status == "PASS" and not calculation.warnings:
        return "ok"
    return "warning"


def build_core_response(payload: CoreWSectionRequest, calculation: VerificationResponse) -> CoreWSectionResponse:
    target_ids = payload.target_ids or [payload.member_id]
    design_status = _design_status(calculation.overall_status)
    checks = [
        CoreDesignCheck(
            id=f"{payload.run_id}:{name}",
            name=name,
            status="fail" if ratio > 1.0 else "pass",
            utilization=ratio,
            loadCombinationId=payload.load_combination_id,
        )
        for name, ratio in calculation.utilization_ratios.items()
    ]
    governing_id = f"{payload.run_id}:{calculation.governing_check}" if calculation.governing_check else None
    governing_utilization = (
        calculation.utilization_ratios.get(calculation.governing_check)
        if calculation.governing_check
        else (max(calculation.utilization_ratios.values()) if calculation.utilization_ratios else None)
    )
    trace = [
        {"stage": "core_contract", "status": "PASS", "schema_version": CORE_SCHEMA_VERSION, "request_schema_version": payload.model_schema_version},
        {"stage": "analysis_reference", "analysis_run_id": payload.analysis_run_id, "load_combination_id": payload.load_combination_id},
        {"stage": "w_section_verification", "status": calculation.overall_status},
    ]
    design_run = CoreDesignRun(
        id=payload.run_id,
        calculator=CALCULATOR_ID,
        calculatorVersion=payload.calculator_version,
        targetIds=target_ids,
        analysisRunId=payload.analysis_run_id,
        status=_run_status(calculation),
        code="CSA S16",
        warnings=calculation.warnings,
        errors=calculation.fatal_errors,
    )
    member_result = CoreMemberDesignResult(
        id=f"{payload.run_id}:{payload.member_id}",
        runId=payload.run_id,
        memberId=payload.member_id,
        calculator=CALCULATOR_ID,
        calculatorVersion=payload.calculator_version,
        code="CSA S16",
        status=design_status,
        assignedSectionId=payload.verification.section_id,
        governingCheckId=governing_id,
        utilization=governing_utilization,
        checks=checks,
        warnings=calculation.warnings,
        trace=trace,
    )
    return CoreWSectionResponse(
        projectId=payload.project_id,
        runId=payload.run_id,
        calculatorVersion=payload.calculator_version,
        targetIds=target_ids,
        designRun=design_run,
        memberDesignResults=[member_result],
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
        trace=trace,
    )
