"""Regression, boundary, and validation tests for ECS-WSECTION-CSA-S16-2019-001."""

from dataclasses import replace

import pytest

from steel_w_section_csa_s16 import (
    CodeConfig,
    DesignActions,
    MaterialProperties,
    MemberGeometry,
    SectionProperties,
    ServiceabilityCriteria,
    WSectionCalculationInput,
    calculate_w_section,
)
from steel_w_section_csa_s16.models.outputs import CheckStatus
from steel_w_section_csa_s16.validation.errors import InputValidationError


@pytest.fixture
def benchmark_input() -> WSectionCalculationInput:
    return WSectionCalculationInput(
        code=CodeConfig(
            continuous_lateral_restraint_confirmed=False,
            coincident_force_set=False,
            net_area_equals_gross_confirmed=True,
        ),
        material=MaterialProperties(
            yield_strength=248.0,
            ultimate_strength=414.0,
            elastic_modulus=200000.0,
            shear_modulus=77000.0,
            mass_density=7850.0,
        ),
        section=SectionProperties(
            section_name_imperial="W4x13",
            section_name_metric="W100x19",
            section_database_version="2022-04-04",
            depth=106.0,
            flange_width=103.0,
            flange_thickness=8.8,
            web_thickness=7.1,
            gross_area=2470.0,
            moment_of_inertia_major=4.760e6,
            moment_of_inertia_minor=1.610e6,
            elastic_modulus_major=89800.0,
            elastic_modulus_minor=31200.0,
            plastic_modulus_major=1.030e5,
            plastic_modulus_minor=47900.0,
            radius_of_gyration_major=43.9,
            radius_of_gyration_minor=25.5,
            warping_constant=3.8e9,
            torsional_constant=62900.0,
            mass_per_length=19.0,
            database_record_verified=False,
        ),
        geometry=MemberGeometry(
            length_major=500.0,
            length_minor=500.0,
            length_torsional=500.0,
            effective_length_factor_major=0.8,
            effective_length_factor_minor=0.8,
            effective_length_factor_torsional=0.8,
        ),
        actions=DesignActions(
            compression_force=1137.0,
            tension_force=8510.0,
            shear_major=3820.0,
            shear_minor=5930.0,
            moment_major=2.38e6,
            moment_minor=3.63e6,
            live_load_deflection=0.082,
        ),
        serviceability=ServiceabilityCriteria(deflection_limit_ratio=300.0),
    )


def test_vc001_source_benchmark(benchmark_input: WSectionCalculationInput) -> None:
    result = calculate_w_section(benchmark_input)
    iv = result.intermediate_values

    assert result.values["polar_radius"].raw_value == pytest.approx(50.8, abs=0.1)
    assert result.values["slenderness_major"].raw_value == pytest.approx(9.1, abs=0.1)
    assert result.values["slenderness_minor"].raw_value == pytest.approx(15.7, abs=0.1)
    assert iv["tension_yielding"] / 1000 == pytest.approx(551.8, rel=0.002)
    assert iv["tension_ultimate"] / 1000 == pytest.approx(766.4, rel=0.002)
    assert iv["elastic_buckling_major"] == pytest.approx(23776.0, rel=0.002)
    assert iv["elastic_buckling_minor"] == pytest.approx(8022.1, rel=0.002)
    assert iv["elastic_buckling_torsional"] == pytest.approx(8105.2, rel=0.005)
    assert result.values["compression_resistance"].raw_value / 1000 == pytest.approx(547.9, rel=0.005)
    assert iv["web_shear_area"] == pytest.approx(627.6, abs=0.1)
    assert iv["flange_shear_area"] == pytest.approx(1812.8, abs=0.1)
    assert iv["major_shear_stress"] == pytest.approx(163.8, rel=0.002)
    assert result.values["major_shear_resistance"].raw_value / 1000 == pytest.approx(92.5, rel=0.005)
    assert iv["minor_shear_stress"] == pytest.approx(163.7, rel=0.002)
    assert result.values["minor_shear_resistance"].raw_value / 1000 == pytest.approx(267.1, rel=0.005)
    assert result.values["section_class"].raw_value == 1
    assert result.values["moment_resistance_major"].raw_value / 1e6 == pytest.approx(23.0, rel=0.005)
    assert result.values["moment_resistance_minor"].raw_value / 1e6 == pytest.approx(10.7, rel=0.005)
    assert result.utilization_ratios["biaxial_bending"] * 100 == pytest.approx(44.27, abs=0.05)
    assert result.utilization_ratios["compression_bending"] * 100 == pytest.approx(37.84, abs=0.05)
    assert result.utilization_ratios["tension_bending"] * 100 == pytest.approx(30.69, abs=0.05)
    assert result.values["allowable_deflection"].raw_value == pytest.approx(1.7, abs=0.1)
    assert result.values["max_uls_utilization"].raw_value * 100 == pytest.approx(44.27, abs=0.05)
    assert result.governing_check == "biaxial_bending"
    assert result.overall_status is CheckStatus.PASS


def test_vc002_slenderness_boundary(benchmark_input: WSectionCalculationInput) -> None:
    s = benchmark_input.section
    g_at = replace(
        benchmark_input.geometry,
        length_major=200.0 * s.radius_of_gyration_major / 0.8,
        length_minor=100.0,
    )
    result_at = calculate_w_section(replace(benchmark_input, geometry=g_at))
    assert result_at.slenderness_status is CheckStatus.PASS

    g_above = replace(g_at, length_major=g_at.length_major * (1.0 + 1e-9))
    result_above = calculate_w_section(replace(benchmark_input, geometry=g_above))
    assert result_above.slenderness_status is CheckStatus.FAIL


def test_vc005_class_two_uses_elastic_modulus(benchmark_input: WSectionCalculationInput) -> None:
    section = replace(benchmark_input.section, flange_width=170.0)
    result = calculate_w_section(replace(benchmark_input, section=section))
    assert result.values["section_class"].raw_value == 2
    expected = benchmark_input.code.phi_s * section.elastic_modulus_major * benchmark_input.material.yield_strength
    assert result.values["moment_resistance_major"].raw_value == pytest.approx(expected)


def test_vc006_class_four_is_rejected(benchmark_input: WSectionCalculationInput) -> None:
    section = replace(benchmark_input.section, flange_width=400.0)
    with pytest.raises(InputValidationError, match="Class 4"):
        calculate_w_section(replace(benchmark_input, section=section))


def test_vc007_compression_at_euler_load_is_rejected(benchmark_input: WSectionCalculationInput) -> None:
    base = calculate_w_section(benchmark_input)
    ce_x = base.intermediate_values["euler_load_major"]
    actions = replace(benchmark_input.actions, compression_force=ce_x)
    with pytest.raises(InputValidationError, match="Ce_x"):
        calculate_w_section(replace(benchmark_input, actions=actions))


def test_vc008_zero_actions(benchmark_input: WSectionCalculationInput) -> None:
    actions = DesignActions(0, 0, 0, 0, 0, 0, 0)
    result = calculate_w_section(replace(benchmark_input, actions=actions))
    assert all(value == 0.0 for value in result.utilization_ratios.values())
    assert result.overall_status is CheckStatus.PASS


def test_vc009_noncoincident_warning(benchmark_input: WSectionCalculationInput) -> None:
    result = calculate_w_section(benchmark_input)
    assert "WARN_NONCOINCIDENT_ENVELOPE" in result.warnings


def test_vc011_fu_below_fy_is_invalid(benchmark_input: WSectionCalculationInput) -> None:
    material = replace(benchmark_input.material, ultimate_strength=200.0)
    with pytest.raises(InputValidationError, match="ultimate_strength"):
        calculate_w_section(replace(benchmark_input, material=material))


def test_vc012_deflection_boundary(benchmark_input: WSectionCalculationInput) -> None:
    allowable = 500.0 / 300.0
    at_limit = replace(
        benchmark_input,
        actions=replace(benchmark_input.actions, live_load_deflection=allowable),
    )
    assert calculate_w_section(at_limit).sls_status is CheckStatus.PASS

    above = replace(
        at_limit,
        actions=replace(at_limit.actions, live_load_deflection=allowable + 1e-9),
    )
    assert calculate_w_section(above).sls_status is CheckStatus.FAIL


def test_vc013_minor_shear_applies_phi_once(benchmark_input: WSectionCalculationInput) -> None:
    result = calculate_w_section(benchmark_input)
    expected_stress = 0.66 * benchmark_input.material.yield_strength
    expected_resistance = (
        benchmark_input.code.phi_s
        * 2
        * benchmark_input.section.flange_width
        * benchmark_input.section.flange_thickness
        * expected_stress
    )
    assert result.intermediate_values["minor_shear_stress"] == pytest.approx(expected_stress)
    assert result.values["minor_shear_resistance"].raw_value == pytest.approx(expected_resistance)


def test_vc014_ltb_warning(benchmark_input: WSectionCalculationInput) -> None:
    result = calculate_w_section(benchmark_input)
    assert "WARN_LTB_NOT_IMPLEMENTED" in result.warnings
