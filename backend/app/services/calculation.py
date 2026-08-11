from __future__ import annotations

from dataclasses import asdict
import sys
from pathlib import Path

ENGINEERING_PACKAGE_ROOT = Path(__file__).resolve().parents[3] / "packages" / "engineering" / "steel_w_section_csa_s16"
if str(ENGINEERING_PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINEERING_PACKAGE_ROOT))

from steel_w_section_csa_s16 import (  # noqa: E402
    CodeConfig,
    DesignActions,
    MaterialProperties,
    MemberGeometry,
    SectionProperties,
    ServiceabilityCriteria,
    TraceabilityMetadata,
    WSectionCalculationInput,
    calculate_w_section,
)
from steel_w_section_csa_s16.validation.errors import InputValidationError  # noqa: E402

from app.models.api import VerificationRequest, VerificationResponse
from app.services.cisc import CiscDatasetService


ENGINE_ID = "ECS-WSECTION-CSA-S16-2019-001"
ENGINE_SPEC_VERSION = "0.2"
ENGINE_PACKAGE_VERSION = "0.1.0"


def build_engine_input(request: VerificationRequest, cisc: CiscDatasetService) -> WSectionCalculationInput:
    section = cisc.get_section(request.section_id, request.designation, request.dataset_version)
    p = lambda key: cisc.property_value(section, key)

    return WSectionCalculationInput(
        code=CodeConfig(
            continuous_lateral_restraint_confirmed=request.continuous_lateral_restraint_confirmed,
            coincident_force_set=request.coincident_force_set,
            net_area_equals_gross_confirmed=request.net_area_equals_gross_confirmed,
        ),
        material=MaterialProperties(**request.material.model_dump()),
        section=SectionProperties(
            section_name_imperial=section.designation_imperial or section.designation,
            section_name_metric=section.designation_metric or section.designation,
            section_database_version=section.dataset_version,
            depth=p("depth"),
            flange_width=p("flange_width"),
            flange_thickness=p("flange_thickness"),
            web_thickness=p("web_thickness"),
            gross_area=p("gross_area"),
            moment_of_inertia_major=p("moment_of_inertia_major"),
            moment_of_inertia_minor=p("moment_of_inertia_minor"),
            elastic_modulus_major=p("elastic_modulus_major"),
            elastic_modulus_minor=p("elastic_modulus_minor"),
            plastic_modulus_major=p("plastic_modulus_major"),
            plastic_modulus_minor=p("plastic_modulus_minor"),
            radius_of_gyration_major=p("radius_of_gyration_major"),
            radius_of_gyration_minor=p("radius_of_gyration_minor"),
            warping_constant=p("warping_constant"),
            torsional_constant=p("torsional_constant"),
            mass_per_length=float(section.properties["mass_per_length"]) if section.properties.get("mass_per_length") is not None else None,
            database_record_verified=True,
        ),
        geometry=MemberGeometry(**request.geometry.model_dump()),
        actions=DesignActions(**request.actions.model_dump()),
        serviceability=ServiceabilityCriteria(deflection_limit_ratio=request.deflection_limit_ratio),
        traceability=TraceabilityMetadata(project_id=request.project_id),
    )


def run_verification(request: VerificationRequest, cisc: CiscDatasetService) -> VerificationResponse:
    engine_input = build_engine_input(request, cisc)
    result = calculate_w_section(engine_input)
    values = {
        key: {
            **asdict(value),
            "code_reference_ids": list(value.code_reference_ids),
        }
        for key, value in result.values.items()
    }
    intermediate = {k: v for k, v in result.intermediate_values.items()}
    return VerificationResponse(
        values=values,
        intermediate_values=intermediate,
        utilization_ratios=result.utilization_ratios,
        governing_check=result.governing_check,
        uls_status=result.uls_status.value,
        sls_status=result.sls_status.value,
        slenderness_status=result.slenderness_status.value,
        overall_status=result.overall_status.value,
        warnings=list(result.warnings),
        fatal_errors=list(result.fatal_errors),
        formula_ids=list(result.formula_ids),
        code_reference_ids=list(result.code_reference_ids),
        normalized_inputs=result.normalized_inputs,
        engine={
            "id": ENGINE_ID,
            "specification_version": ENGINE_SPEC_VERSION,
            "package_version": ENGINE_PACKAGE_VERSION,
        },
        section_dataset={
            "record_id": request.section_id,
            "designation": request.designation,
            "version": request.dataset_version,
        },
    )
