"""Input validation for the CSA S16 W-section module."""

from math import isfinite, sqrt

from ..models.inputs import WSectionCalculationInput
from .errors import InputValidationError


def _require_positive(name: str, value: float) -> None:
    if not isinstance(value, (int, float)):
        raise InputValidationError(
            f"{name} must be numeric; received {type(value).__name__}. "
            "Provide a finite positive value in the documented internal units."
        )
    if not isfinite(float(value)) or value <= 0:
        raise InputValidationError(
            f"{name} must be finite and greater than zero; received {value!r}."
        )


def _require_nonnegative(name: str, value: float) -> None:
    if not isinstance(value, (int, float)):
        raise InputValidationError(
            f"{name} must be numeric; received {type(value).__name__}."
        )
    if not isfinite(float(value)) or value < 0:
        raise InputValidationError(
            f"{name} must be finite and non-negative; received {value!r}."
        )


def validate_inputs(data: WSectionCalculationInput) -> list[str]:
    """Validate required fields, ranges, combinations, and section consistency."""

    warnings: list[str] = []
    m = data.material
    s = data.section
    g = data.geometry
    a = data.actions
    c = data.code

    for name, value in {
        "yield_strength": m.yield_strength,
        "ultimate_strength": m.ultimate_strength,
        "elastic_modulus": m.elastic_modulus,
        "shear_modulus": m.shear_modulus,
        "phi_s": c.phi_s,
        "phi_u": c.phi_u,
        "n_comp": c.n_comp,
        "lambda_limit": c.lambda_limit,
        "depth": s.depth,
        "flange_width": s.flange_width,
        "flange_thickness": s.flange_thickness,
        "web_thickness": s.web_thickness,
        "gross_area": s.gross_area,
        "moment_of_inertia_major": s.moment_of_inertia_major,
        "moment_of_inertia_minor": s.moment_of_inertia_minor,
        "elastic_modulus_major": s.elastic_modulus_major,
        "elastic_modulus_minor": s.elastic_modulus_minor,
        "plastic_modulus_major": s.plastic_modulus_major,
        "plastic_modulus_minor": s.plastic_modulus_minor,
        "radius_of_gyration_major": s.radius_of_gyration_major,
        "radius_of_gyration_minor": s.radius_of_gyration_minor,
        "warping_constant": s.warping_constant,
        "torsional_constant": s.torsional_constant,
        "length_major": g.length_major,
        "length_minor": g.length_minor,
        "length_torsional": g.length_torsional,
        "effective_length_factor_major": g.effective_length_factor_major,
        "effective_length_factor_minor": g.effective_length_factor_minor,
        "effective_length_factor_torsional": g.effective_length_factor_torsional,
        "deflection_limit_ratio": data.serviceability.deflection_limit_ratio,
    }.items():
        _require_positive(name, value)

    for name, value in {
        "compression_force": a.compression_force,
        "tension_force": a.tension_force,
        "shear_major": a.shear_major,
        "shear_minor": a.shear_minor,
        "moment_major": a.moment_major,
        "moment_minor": a.moment_minor,
        "live_load_deflection": a.live_load_deflection,
    }.items():
        _require_nonnegative(name, value)

    if m.ultimate_strength < m.yield_strength:
        raise InputValidationError(
            "ultimate_strength must be greater than or equal to yield_strength; "
            f"received Fu={m.ultimate_strength} MPa and Fy={m.yield_strength} MPa."
        )
    if s.depth <= 2.0 * s.flange_thickness:
        raise InputValidationError(
            "Section clear web depth must be positive: depth must exceed "
            "2 × flange_thickness."
        )
    if s.flange_width <= s.web_thickness:
        raise InputValidationError(
            "Outstanding flange width is invalid: flange_width must exceed web_thickness."
        )
    if c.code_edition != "CSA S16:2019":
        raise InputValidationError(
            f"Unsupported code edition {c.code_edition!r}; expected 'CSA S16:2019'."
        )
    if not s.section_name_imperial.strip() or not s.section_name_metric.strip():
        raise InputValidationError("Both imperial and metric section names are required.")
    if not s.section_database_version.strip():
        raise InputValidationError("section_database_version is required.")

    rx_calc = sqrt(s.moment_of_inertia_major / s.gross_area)
    ry_calc = sqrt(s.moment_of_inertia_minor / s.gross_area)
    if abs(rx_calc - s.radius_of_gyration_major) / s.radius_of_gyration_major > 0.02:
        warnings.append("WARN_SECTION_RX_INCONSISTENT")
    if abs(ry_calc - s.radius_of_gyration_minor) / s.radius_of_gyration_minor > 0.02:
        warnings.append("WARN_SECTION_RY_INCONSISTENT")
    if not s.database_record_verified:
        warnings.append("WARN_SECTION_DB_UNVERIFIED")
    if not c.coincident_force_set:
        warnings.append("WARN_NONCOINCIDENT_ENVELOPE")
    if not c.continuous_lateral_restraint_confirmed:
        warnings.append("WARN_LTB_NOT_IMPLEMENTED")
    if not c.net_area_equals_gross_confirmed:
        warnings.append("WARN_NET_AREA_EQUALS_GROSS")
    warnings.extend(
        [
            "WARN_MIXED_UNITS_SOURCE",
            "INFO_CODE_REFERENCE_USER_CONFIRMED",
            "WARN_DEFLECTION_LIMIT_PROJECT_SPECIFIC",
            "WARN_UNUSED_CONNECTION_FACTORS",
        ]
    )
    return warnings
