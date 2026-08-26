from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from .api import VerificationRequest, VerificationResponse


CORE_SCHEMA_VERSION = "0.5"
CALCULATOR_ID = "w-section"
CALCULATOR_VERSION = "1.0"


class CoreMemberForceStation(BaseModel):
    x: float
    xRatio: float | None = None
    axial: float | None = None
    shearY: float | None = None
    shearZ: float | None = None
    torsion: float | None = None
    momentY: float | None = None
    momentZ: float | None = None


class CoreWSectionInputs(BaseModel):
    memberId: str
    verification: VerificationRequest
    analysisRunId: str | None = None
    loadCombinationId: str | None = None
    forceCoordinateSystem: Literal["member-local"] = "member-local"
    forceStations: list[CoreMemberForceStation] = Field(default_factory=list)


class CoreWSectionV05Request(BaseModel):
    """Canonical Core v0.5 CalculatorEnvelope specialized for W-section design."""

    modelSchemaVersion: Literal["0.5"] = CORE_SCHEMA_VERSION
    projectId: str
    runId: str
    calculator: Literal["w-section"] = CALCULATOR_ID
    calculatorVersion: str = CALCULATOR_VERSION
    targetIds: list[str]
    inputs: CoreWSectionInputs


class CoreDesignCheck(BaseModel):
    id: str
    name: str
    status: Literal["pass", "fail", "warning", "not-checked"]
    utilization: float | None = None
    loadCombinationId: str | None = None
    codeClause: str | None = None
    station: float | None = None
    notes: list[str] = Field(default_factory=list)


class CoreDesignRun(BaseModel):
    id: str
    calculator: str
    calculatorVersion: str
    modelSchemaVersion: Literal["0.5"] = CORE_SCHEMA_VERSION
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


class CoreWSectionV05Response(BaseModel):
    """Canonical Core v0.5 CalculatorWriteback specialized for W-section design."""

    runId: str
    modelSchemaVersion: Literal["0.5"] = CORE_SCHEMA_VERSION
    designRun: CoreDesignRun
    memberDesignResults: list[CoreMemberDesignResult]
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    trace: list[dict[str, Any]] = Field(default_factory=list)


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


def build_core_v05_response(
    payload: CoreWSectionV05Request,
    calculation: VerificationResponse,
) -> CoreWSectionV05Response:
    member_id = payload.inputs.memberId
    target_ids = payload.targetIds or [member_id]
    design_status = _design_status(calculation.overall_status)
    load_combination_id = payload.inputs.loadCombinationId

    checks = [
        CoreDesignCheck(
            id=f"{payload.runId}:{name}",
            name=name,
            status="fail" if ratio > 1.0 else "pass",
            utilization=ratio,
            loadCombinationId=load_combination_id,
        )
        for name, ratio in calculation.utilization_ratios.items()
    ]

    governing_id = (
        f"{payload.runId}:{calculation.governing_check}"
        if calculation.governing_check
        else None
    )
    governing_utilization = (
        calculation.utilization_ratios.get(calculation.governing_check)
        if calculation.governing_check
        else (
            max(calculation.utilization_ratios.values())
            if calculation.utilization_ratios
            else None
        )
    )

    trace: list[dict[str, Any]] = [
        {
            "stage": "core_contract",
            "status": "PASS",
            "schemaVersion": CORE_SCHEMA_VERSION,
        },
        {
            "stage": "analysis_reference",
            "analysisRunId": payload.inputs.analysisRunId,
            "loadCombinationId": load_combination_id,
            "forceCoordinateSystem": payload.inputs.forceCoordinateSystem,
            "stationCount": len(payload.inputs.forceStations),
        },
        {
            "stage": "w_section_verification",
            "status": calculation.overall_status,
            "engineeringEnginePreserved": True,
        },
    ]

    design_run = CoreDesignRun(
        id=payload.runId,
        calculator=payload.calculator,
        calculatorVersion=payload.calculatorVersion,
        targetIds=target_ids,
        analysisRunId=payload.inputs.analysisRunId,
        status=_run_status(calculation),
        code="CSA S16",
        codeEdition="2019",
        warnings=calculation.warnings,
        errors=calculation.fatal_errors,
    )

    member_result = CoreMemberDesignResult(
        id=f"{payload.runId}:{member_id}",
        runId=payload.runId,
        memberId=member_id,
        calculator=payload.calculator,
        calculatorVersion=payload.calculatorVersion,
        code="CSA S16",
        codeEdition="2019",
        status=design_status,
        assignedSectionId=payload.inputs.verification.section_id,
        governingCheckId=governing_id,
        utilization=governing_utilization,
        checks=checks,
        warnings=calculation.warnings,
        trace=trace,
    )

    return CoreWSectionV05Response(
        runId=payload.runId,
        designRun=design_run,
        memberDesignResults=[member_result],
        warnings=calculation.warnings,
        errors=calculation.fatal_errors,
        trace=trace,
    )
