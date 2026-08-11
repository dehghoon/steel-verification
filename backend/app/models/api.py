from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class MaterialInput(BaseModel):
    yield_strength: float = Field(gt=0)
    ultimate_strength: float = Field(gt=0)
    elastic_modulus: float = Field(gt=0)
    shear_modulus: float = Field(gt=0)
    mass_density: float | None = Field(default=None, gt=0)


class GeometryInput(BaseModel):
    length_major: float = Field(gt=0)
    length_minor: float = Field(gt=0)
    length_torsional: float = Field(gt=0)
    effective_length_factor_major: float = Field(gt=0)
    effective_length_factor_minor: float = Field(gt=0)
    effective_length_factor_torsional: float = Field(gt=0)


class ActionsInput(BaseModel):
    compression_force: float = Field(ge=0)
    tension_force: float = Field(ge=0)
    shear_major: float = Field(ge=0)
    shear_minor: float = Field(ge=0)
    moment_major: float = Field(ge=0)
    moment_minor: float = Field(ge=0)
    live_load_deflection: float = Field(ge=0)


class VerificationRequest(BaseModel):
    section_id: str
    designation: str
    dataset_version: str
    material: MaterialInput
    geometry: GeometryInput
    actions: ActionsInput
    deflection_limit_ratio: float = Field(default=300.0, gt=0)
    continuous_lateral_restraint_confirmed: bool = False
    coincident_force_set: bool = False
    net_area_equals_gross_confirmed: bool = False
    project_id: str | None = None


class ReportedValueResponse(BaseModel):
    raw_value: float
    display_value: float
    unit: str
    formula_id: str
    source_reference: str
    code_reference_ids: list[str]


class VerificationResponse(BaseModel):
    values: dict[str, ReportedValueResponse]
    intermediate_values: dict[str, float | str]
    utilization_ratios: dict[str, float]
    governing_check: str | None
    uls_status: str
    sls_status: str
    slenderness_status: str
    overall_status: str
    warnings: list[str]
    fatal_errors: list[str]
    formula_ids: list[str]
    code_reference_ids: list[str]
    normalized_inputs: dict[str, Any]
    engine: dict[str, str]
    section_dataset: dict[str, str]


class SectionRecord(BaseModel):
    id: str
    designation: str
    designation_imperial: str | None = None
    designation_metric: str | None = None
    family: str
    source: str
    dataset_version: str
    units: dict[str, str]
    properties: dict[str, float | int | str | None]


class SectionListResponse(BaseModel):
    items: list[SectionRecord]
    total: int
    dataset_version: str


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ReportPreviewRequest(BaseModel):
    calculation: VerificationResponse
    project: dict[str, Any] = Field(default_factory=dict)


class ReportPreviewResponse(BaseModel):
    status: Literal["preview"]
    title: str
    sections: list[dict[str, Any]]
    official_download_available: bool
    limitation: str
