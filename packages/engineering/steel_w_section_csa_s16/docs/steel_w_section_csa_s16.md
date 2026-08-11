# Steel W-Section CSA S16:2019 Calculation Module

## Module Name

`steel_w_section_csa_s16`

## Purpose

Standalone Python implementation of Engineering Calculation Specification
`ECS-WSECTION-CSA-S16-2019-001`, Version 0.2, for a doubly symmetric rolled
W-section.

## Governing Standard

The source specification states CSA S16:2019 and retains user-confirmed code
references. This software does not independently certify compliance with the
standard.

## Scope

The module calculates member slenderness, tension resistance, compression
resistance, biaxial shear resistance, section classification, biaxial moment
resistance, axial-plus-bending interactions, serviceability deflection, and
governing utilization.

Connection design, lateral-torsional buckling resistance, Class 4 effective
section properties, concentrated-load checks, and section database retrieval
are excluded.

## Inputs and Units

All runtime dimensional inputs are explicit internal SI values:

- force: N
- length and deflection: mm
- stress and elastic moduli: MPa
- moment: N·mm
- area: mm²
- second moment and torsional constant: mm⁴
- section modulus: mm³
- warping constant: mm⁶

The module does not silently convert units.

## Outputs

`CalculationResult` contains normalized inputs, reportable values with raw and
display values, intermediate variables, utilization ratios, governing mode,
ULS/SLS/slenderness/overall status, warnings, formula IDs, and code-reference
IDs.

## Formula Summary

The implementation follows FR-001 through FR-021 in specification order.
Notable controlled decisions are:

- FR-009: `phi_s` is applied exactly once.
- FR-013: the documented source branch is implemented exactly; plastic modulus
  is selected only when `section_class < 2`.
- FR-017: `beta_1` is retained at full precision and only rounded for display.
- FR-021: deflection remains separate from `MaxUZ`.

## Validation Rules

The engine rejects missing or non-positive properties, `Fu < Fy`, invalid
geometry, unsupported code editions, negative action magnitudes, Class 4
sections, negative web classification limits, and compression force at or above
an Euler load used by FR-015.

Section radii are checked against `sqrt(I/A)` with a 2% warning tolerance.

## Error Conditions

Validation failures raise `InputValidationError` with the failed quantity,
reason, expected condition, and corrective direction. Engineering errors are
not hidden or silently corrected.

## Example

Run:

```bash
python examples/benchmark_example.py
```

## Testing

Install the test dependency and run:

```bash
python -m pip install -e ".[test]"
pytest
```

Tests include the source benchmark plus boundary, invalid-input, regression,
warning, corrected minor-shear, Class 2 branch, Class 4, Euler denominator,
zero-action, and deflection cases.

## Limitations

The package issues warnings when lateral restraint, coincident actions, approved
section database verification, or the gross-equals-net-area assumption are not
confirmed. The L/300 criterion remains project-specific.

## Revision History

- 0.1.0: Initial implementation from specification Version 0.2.
