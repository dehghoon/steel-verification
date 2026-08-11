"""Example calculation for the W100x19 / W4x13 benchmark."""

from steel_w_section_csa_s16 import (
    CodeConfig,
    DesignActions,
    MaterialProperties,
    MemberGeometry,
    SectionProperties,
    WSectionCalculationInput,
    calculate_w_section,
)

calculation_input = WSectionCalculationInput(
    code=CodeConfig(net_area_equals_gross_confirmed=True),
    material=MaterialProperties(248.0, 414.0, 200000.0, 77000.0),
    section=SectionProperties(
        "W4x13", "W100x19", "2022-04-04",
        106.0, 103.0, 8.8, 7.1, 2470.0,
        4.760e6, 1.610e6, 89800.0, 31200.0,
        1.030e5, 47900.0, 43.9, 25.5, 3.8e9, 62900.0,
    ),
    geometry=MemberGeometry(500.0, 500.0, 500.0, 0.8, 0.8, 0.8),
    actions=DesignActions(1137.0, 8510.0, 3820.0, 5930.0, 2.38e6, 3.63e6, 0.082),
)

result = calculate_w_section(calculation_input)
print(result.overall_status.value)
print(result.governing_check)
print(result.values["max_uls_utilization"].display_value)
print(result.warnings)
