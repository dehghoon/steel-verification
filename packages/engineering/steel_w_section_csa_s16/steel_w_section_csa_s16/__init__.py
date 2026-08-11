"""Public API for the CSA S16:2019 W-section calculation package."""

from .calculations.steel_w_section_csa_s16 import calculate_w_section
from .models.inputs import (
    CodeConfig,
    DesignActions,
    MaterialProperties,
    MemberGeometry,
    SectionProperties,
    ServiceabilityCriteria,
    TraceabilityMetadata,
    WSectionCalculationInput,
)
from .models.outputs import CalculationResult, CheckStatus

__all__ = [
    "calculate_w_section",
    "CodeConfig",
    "DesignActions",
    "MaterialProperties",
    "MemberGeometry",
    "SectionProperties",
    "ServiceabilityCriteria",
    "TraceabilityMetadata",
    "WSectionCalculationInput",
    "CalculationResult",
    "CheckStatus",
]
