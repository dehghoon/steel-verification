"""CSA S16:2019 W-section member resistance and serviceability verification.

Implements ECS-WSECTION-CSA-S16-2019-001, Version 0.2, Formula IDs
FR-001 through FR-021. All internal units are N, mm, MPa, and N·mm.
"""

from __future__ import annotations

from dataclasses import asdict
from math import pi, sqrt

from ..models.inputs import WSectionCalculationInput
from ..models.outputs import CalculationResult, CheckStatus, ReportedValue
from ..validation.errors import InputValidationError
from ..validation.validators import validate_inputs

FORMULA_IDS = tuple(f"FR-{index:03d}" for index in range(1, 22))
CODE_REFERENCE_IDS = tuple(f"CR-{index:03d}" for index in range(1, 15))
SOURCE_REFERENCE = "ECS-WSECTION-CSA-S16-2019-001 v0.2"


def _reported(
    raw_value: float,
    unit: str,
    formula_id: str,
    *,
    decimals: int = 3,
    code_reference_ids: tuple[str, ...] = (),
) -> ReportedValue:
    return ReportedValue(
        raw_value=raw_value,
        display_value=round(raw_value, decimals),
        unit=unit,
        formula_id=formula_id,
        source_reference=SOURCE_REFERENCE,
        code_reference_ids=code_reference_ids,
    )


def _classify_flange(width_thickness_ratio: float, yield_strength: float) -> int:
    """Implement FR-010 using the source's strict '<' boundaries."""

    root_fy = sqrt(yield_strength)
    if width_thickness_ratio < 145.0 / root_fy:
        return 1
    if width_thickness_ratio < 170.0 / root_fy:
        return 2
    if width_thickness_ratio < 200.0 / root_fy:
        return 3
    return 4


def _classify_web(
    depth_thickness_ratio: float,
    compression_force: float,
    phi_s: float,
    gross_area: float,
    yield_strength: float,
) -> tuple[int, tuple[float, float, float]]:
    """Implement FR-011 using source-stated '<=' boundaries."""

    axial_ratio = compression_force / (phi_s * gross_area * yield_strength)
    modifiers = (
        1.0 - 0.39 * axial_ratio,
        1.0 - 0.61 * axial_ratio,
        1.0 - 0.65 * axial_ratio,
    )
    if any(value < 0.0 for value in modifiers):
        raise InputValidationError(
            "Web classification limit became negative due to excessive compression "
            f"ratio Cf/(phi_s*A*Fy)={axial_ratio:.6g}. The specification requires "
            "this condition to be treated as fatal."
        )
    root_fy = sqrt(yield_strength)
    limits = (
        1100.0 * modifiers[0] / root_fy,
        1700.0 * modifiers[1] / root_fy,
        1900.0 * modifiers[2] / root_fy,
    )
    if depth_thickness_ratio <= limits[0]:
        return 1, limits
    if depth_thickness_ratio <= limits[1]:
        return 2, limits
    if depth_thickness_ratio <= limits[2]:
        return 3, limits
    return 4, limits


def _major_shear_stress(
    web_slenderness: float, yield_strength: float
) -> tuple[float, str]:
    """Implement FR-008 piecewise major-axis shear stress."""

    root_fy = sqrt(yield_strength)
    if web_slenderness <= 1014.0 / root_fy:
        return 0.66 * yield_strength, "branch_1"
    if web_slenderness <= 1435.0 / root_fy:
        return 670.0 * root_fy / web_slenderness, "branch_2"
    return 961200.0 / web_slenderness**2, "branch_3"


def calculate_w_section(data: WSectionCalculationInput) -> CalculationResult:
    """Calculate W-section resistance and serviceability checks.

    Parameters
    ----------
    data:
        Structured calculation inputs. Values must already use N, mm, MPa,
        and N·mm internal units.

    Returns
    -------
    CalculationResult
        Capacities, ratios, traceability, warnings, and statuses.

    Raises
    ------
    InputValidationError
        If required data, formula domains, or fatal combinations are invalid.

    Notes
    -----
    FR-009 applies ``phi_s`` once. FR-013 implements the source branch exactly:
    plastic modulus only when ``section_class < 2``. FR-017 uses unrounded
    ``beta_1`` in all calculations.
    """

    warnings = validate_inputs(data)
    c, m, s, g, a = data.code, data.material, data.section, data.geometry, data.actions

    # FR-001
    polar_radius = sqrt(
        s.radius_of_gyration_major**2 + s.radius_of_gyration_minor**2
    )

    # FR-002
    slenderness_major = (
        g.effective_length_factor_major
        * g.length_major
        / s.radius_of_gyration_major
    )
    slenderness_minor = (
        g.effective_length_factor_minor
        * g.length_minor
        / s.radius_of_gyration_minor
    )
    governing_slenderness = max(slenderness_major, slenderness_minor)

    # FR-003
    tension_yielding = c.phi_s * m.yield_strength * s.gross_area
    tension_ultimate = c.phi_u * m.ultimate_strength * s.gross_area
    tension_resistance = min(tension_yielding, tension_ultimate)

    # FR-004 and FR-005
    elastic_buckling_major = (
        pi**2 * m.elastic_modulus / slenderness_major**2
    )
    elastic_buckling_minor = (
        pi**2 * m.elastic_modulus / slenderness_minor**2
    )
    elastic_buckling_torsional = (
        pi**2
        * m.elastic_modulus
        * s.warping_constant
        / (
            (g.effective_length_factor_torsional * g.length_torsional) ** 2
            * s.gross_area
            * polar_radius**2
        )
        + m.shear_modulus
        * s.torsional_constant
        / (s.gross_area * polar_radius**2)
    )

    # FR-006
    elastic_buckling_governing = min(
        elastic_buckling_major,
        elastic_buckling_minor,
        elastic_buckling_torsional,
    )
    compression_parameter = sqrt(
        m.yield_strength / elastic_buckling_governing
    )
    compression_resistance = (
        c.phi_s
        * s.gross_area
        * m.yield_strength
        * (1.0 + compression_parameter ** (2.0 * c.n_comp))
        ** (-1.0 / c.n_comp)
    )

    # FR-007 to FR-009
    clear_web_depth = s.depth - 2.0 * s.flange_thickness
    web_shear_area = clear_web_depth * s.web_thickness
    flange_shear_area = 2.0 * s.flange_width * s.flange_thickness
    web_slenderness = clear_web_depth / s.web_thickness
    major_shear_stress, major_shear_branch = _major_shear_stress(
        web_slenderness, m.yield_strength
    )
    major_shear_resistance = c.phi_s * web_shear_area * major_shear_stress
    minor_shear_stress = 0.66 * m.yield_strength
    minor_shear_resistance = c.phi_s * flange_shear_area * minor_shear_stress

    # FR-015 denominator-domain validation is performed before classification
    # so the requested amplification failure is reported deterministically.
    euler_load_major = (
        pi**2
        * m.elastic_modulus
        * s.moment_of_inertia_major
        / (g.effective_length_factor_major * g.length_major) ** 2
    )
    euler_load_minor = (
        pi**2
        * m.elastic_modulus
        * s.moment_of_inertia_minor
        / (g.effective_length_factor_minor * g.length_minor) ** 2
    )
    if a.compression_force >= euler_load_major:
        raise InputValidationError(
            "compression_force must be less than Euler load Ce_x; otherwise "
            "the FR-015 amplification denominator is zero or negative."
        )
    if a.compression_force >= euler_load_minor:
        raise InputValidationError(
            "compression_force must be less than Euler load Ce_y; otherwise "
            "the FR-015 amplification denominator is zero or negative."
        )

    # FR-010 to FR-012
    outstanding_flange_width = (s.flange_width - s.web_thickness) / 2.0
    flange_class = _classify_flange(
        outstanding_flange_width / s.flange_thickness, m.yield_strength
    )
    web_class, web_class_limits = _classify_web(
        clear_web_depth / s.web_thickness,
        a.compression_force,
        c.phi_s,
        s.gross_area,
        m.yield_strength,
    )
    section_class = max(flange_class, web_class)
    if section_class == 4:
        warnings.append("WARN_CLASS4_UNSUPPORTED")
        raise InputValidationError(
            "Section Class 4 is unsupported because no approved effective-section "
            "logic is included in the specification."
        )

    # FR-013: exact source branch, equivalent to Class < 2.
    if section_class < 2:
        modulus_major = s.plastic_modulus_major
        modulus_minor = s.plastic_modulus_minor
    else:
        modulus_major = s.elastic_modulus_major
        modulus_minor = s.elastic_modulus_minor
    moment_resistance_major = c.phi_s * modulus_major * m.yield_strength
    moment_resistance_minor = c.phi_s * modulus_minor * m.yield_strength

    # Ratios FR-014 through FR-021
    ratio_tension = a.tension_force / tension_resistance
    ratio_compression = a.compression_force / compression_resistance
    ratio_shear_major = a.shear_major / major_shear_resistance
    ratio_shear_minor = a.shear_minor / minor_shear_resistance
    ratio_biaxial_bending = (
        a.moment_major / moment_resistance_major
        + a.moment_minor / moment_resistance_minor
    )

    amplification_major = c.omega_1 / (
        1.0 - a.compression_force / euler_load_major
    )
    amplification_minor = c.omega_1 / (
        1.0 - a.compression_force / euler_load_minor
    )
    max_moment = max(a.moment_major, a.moment_minor)
    k_omega = (
        min(a.moment_major, a.moment_minor) / max_moment
        if max_moment > 0.0
        else 0.0
    )
    beta_1 = min(
        0.6
        + 0.4
        * g.effective_length_factor_minor
        * g.length_minor
        / s.radius_of_gyration_minor,
        0.85,
    )
    ratio_compression_bending = (
        ratio_compression
        + 0.85
        * amplification_major
        * a.moment_major
        / moment_resistance_major
        + beta_1
        * amplification_minor
        * a.moment_minor
        / moment_resistance_minor
    )
    ratio_tension_bending = (
        ratio_tension
        + 0.85 * a.moment_major / moment_resistance_major
        + 0.60 * a.moment_minor / moment_resistance_minor
    )
    allowable_deflection = (
        max(g.length_major, g.length_minor, g.length_torsional)
        / data.serviceability.deflection_limit_ratio
    )
    deflection_ratio = a.live_load_deflection / allowable_deflection

    ratios = {
        "tension": ratio_tension,
        "compression": ratio_compression,
        "shear_major": ratio_shear_major,
        "shear_minor": ratio_shear_minor,
        "biaxial_bending": ratio_biaxial_bending,
        "compression_bending": ratio_compression_bending,
        "tension_bending": ratio_tension_bending,
    }
    governing_check = max(ratios, key=ratios.get)
    max_uls_utilization = ratios[governing_check]

    uls_status = CheckStatus.PASS if max_uls_utilization <= 1.0 else CheckStatus.FAIL
    slenderness_status = (
        CheckStatus.PASS
        if governing_slenderness <= c.lambda_limit
        else CheckStatus.FAIL
    )
    sls_status = (
        CheckStatus.PASS
        if a.live_load_deflection <= allowable_deflection
        else CheckStatus.FAIL
    )
    overall_status = (
        CheckStatus.PASS
        if all(
            status is CheckStatus.PASS
            for status in (uls_status, slenderness_status, sls_status)
        )
        else CheckStatus.FAIL
    )

    values = {
        "polar_radius": _reported(polar_radius, "mm", "FR-001", decimals=3),
        "slenderness_major": _reported(
            slenderness_major, "-", "FR-002", code_reference_ids=("CR-003", "CR-004")
        ),
        "slenderness_minor": _reported(
            slenderness_minor, "-", "FR-002", code_reference_ids=("CR-003", "CR-004")
        ),
        "governing_slenderness": _reported(
            governing_slenderness, "-", "FR-002", code_reference_ids=("CR-003", "CR-004")
        ),
        "tension_resistance": _reported(
            tension_resistance, "N", "FR-003", code_reference_ids=("CR-005",)
        ),
        "compression_resistance": _reported(
            compression_resistance, "N", "FR-006", code_reference_ids=("CR-006",)
        ),
        "major_shear_resistance": _reported(
            major_shear_resistance, "N", "FR-008", code_reference_ids=("CR-007",)
        ),
        "minor_shear_resistance": _reported(
            minor_shear_resistance, "N", "FR-009", code_reference_ids=("CR-008",)
        ),
        "section_class": _reported(
            float(section_class), "-", "FR-012", decimals=0, code_reference_ids=("CR-009",)
        ),
        "moment_resistance_major": _reported(
            moment_resistance_major, "N·mm", "FR-013"
        ),
        "moment_resistance_minor": _reported(
            moment_resistance_minor, "N·mm", "FR-013"
        ),
        "allowable_deflection": _reported(
            allowable_deflection, "mm", "FR-020", code_reference_ids=("CR-012",)
        ),
        "max_uls_utilization": _reported(
            max_uls_utilization, "-", "FR-021", decimals=6
        ),
    }

    intermediate = {
        "tension_yielding": tension_yielding,
        "tension_ultimate": tension_ultimate,
        "elastic_buckling_major": elastic_buckling_major,
        "elastic_buckling_minor": elastic_buckling_minor,
        "elastic_buckling_torsional": elastic_buckling_torsional,
        "elastic_buckling_governing": elastic_buckling_governing,
        "compression_parameter": compression_parameter,
        "clear_web_depth": clear_web_depth,
        "web_shear_area": web_shear_area,
        "flange_shear_area": flange_shear_area,
        "web_slenderness": web_slenderness,
        "major_shear_stress": major_shear_stress,
        "minor_shear_stress": minor_shear_stress,
        "major_shear_branch": major_shear_branch,
        "outstanding_flange_width": outstanding_flange_width,
        "flange_class": float(flange_class),
        "web_class": float(web_class),
        "web_class_limit_1": web_class_limits[0],
        "web_class_limit_2": web_class_limits[1],
        "web_class_limit_3": web_class_limits[2],
        "euler_load_major": euler_load_major,
        "euler_load_minor": euler_load_minor,
        "amplification_major": amplification_major,
        "amplification_minor": amplification_minor,
        "k_omega": k_omega,
        "beta_1": beta_1,
        "allowable_deflection": allowable_deflection,
        "deflection_ratio": deflection_ratio,
    }

    return CalculationResult(
        values=values,
        intermediate_values=intermediate,
        utilization_ratios=ratios,
        governing_check=governing_check,
        uls_status=uls_status,
        sls_status=sls_status,
        slenderness_status=slenderness_status,
        overall_status=overall_status,
        warnings=tuple(dict.fromkeys(warnings)),
        fatal_errors=(),
        formula_ids=FORMULA_IDS,
        code_reference_ids=CODE_REFERENCE_IDS,
        normalized_inputs=asdict(data),
    )
