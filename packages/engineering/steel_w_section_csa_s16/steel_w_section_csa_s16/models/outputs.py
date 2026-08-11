"""Output models for calculation results and traceability."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class CheckStatus(str, Enum):
    """Permitted engineering check states."""

    PASS = "PASS"
    FAIL = "FAIL"
    INDETERMINATE = "INDETERMINATE"


@dataclass(frozen=True)
class ReportedValue:
    """Numerical output retaining raw and display-rounded values."""

    raw_value: float
    display_value: float
    unit: str
    formula_id: str
    source_reference: str
    code_reference_ids: tuple[str, ...] = ()


@dataclass(frozen=True)
class CalculationResult:
    """Complete result from a W-section verification."""

    values: dict[str, ReportedValue]
    intermediate_values: dict[str, float]
    utilization_ratios: dict[str, float]
    governing_check: str | None
    uls_status: CheckStatus
    sls_status: CheckStatus
    slenderness_status: CheckStatus
    overall_status: CheckStatus
    warnings: tuple[str, ...] = ()
    fatal_errors: tuple[str, ...] = ()
    formula_ids: tuple[str, ...] = ()
    code_reference_ids: tuple[str, ...] = ()
    normalized_inputs: dict[str, Any] = field(default_factory=dict)
