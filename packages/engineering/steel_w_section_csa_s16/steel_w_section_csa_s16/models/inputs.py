"""Strongly typed input models for the W-section calculation engine."""

from dataclasses import dataclass


@dataclass(frozen=True)
class CodeConfig:
    """CSA S16 calculation parameters, dimensionless unless noted."""

    code_edition: str = "CSA S16:2019"
    phi_s: float = 0.90
    phi_u: float = 0.75
    phi_w: float = 0.67
    phi_br: float = 0.80
    n_comp: float = 1.34
    lambda_limit: float = 200.0
    omega_1: float = 1.0
    continuous_lateral_restraint_confirmed: bool = False
    coincident_force_set: bool = False
    net_area_equals_gross_confirmed: bool = False


@dataclass(frozen=True)
class MaterialProperties:
    """Material properties in MPa and kg/m³."""

    yield_strength: float
    ultimate_strength: float
    elastic_modulus: float
    shear_modulus: float
    mass_density: float | None = None


@dataclass(frozen=True)
class SectionProperties:
    """W-section properties in mm-based units."""

    section_name_imperial: str
    section_name_metric: str
    section_database_version: str
    depth: float
    flange_width: float
    flange_thickness: float
    web_thickness: float
    gross_area: float
    moment_of_inertia_major: float
    moment_of_inertia_minor: float
    elastic_modulus_major: float
    elastic_modulus_minor: float
    plastic_modulus_major: float
    plastic_modulus_minor: float
    radius_of_gyration_major: float
    radius_of_gyration_minor: float
    warping_constant: float
    torsional_constant: float
    mass_per_length: float | None = None
    database_record_verified: bool = False


@dataclass(frozen=True)
class MemberGeometry:
    """Member lengths in mm and effective-length factors."""

    length_major: float
    length_minor: float
    length_torsional: float
    effective_length_factor_major: float
    effective_length_factor_minor: float
    effective_length_factor_torsional: float


@dataclass(frozen=True)
class DesignActions:
    """Factored actions in N and N·mm; deflection in mm."""

    compression_force: float
    tension_force: float
    shear_major: float
    shear_minor: float
    moment_major: float
    moment_minor: float
    live_load_deflection: float


@dataclass(frozen=True)
class ServiceabilityCriteria:
    """Project serviceability criteria."""

    deflection_limit_ratio: float = 300.0


@dataclass(frozen=True)
class TraceabilityMetadata:
    """Source and project metadata used in calculation reporting."""

    specification_id: str = "ECS-WSECTION-CSA-S16-2019-001"
    specification_version: str = "0.2"
    source_reference: str = "Engineering Calculation Specification"
    project_id: str | None = None


@dataclass(frozen=True)
class WSectionCalculationInput:
    """Complete input object for one W-section verification."""

    code: CodeConfig
    material: MaterialProperties
    section: SectionProperties
    geometry: MemberGeometry
    actions: DesignActions
    serviceability: ServiceabilityCriteria = ServiceabilityCriteria()
    traceability: TraceabilityMetadata = TraceabilityMetadata()
