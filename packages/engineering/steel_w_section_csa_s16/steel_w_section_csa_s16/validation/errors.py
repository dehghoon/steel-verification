"""Engineering-specific validation exceptions."""


class EngineeringCalculationError(Exception):
    """Base class for calculation-engine errors."""


class InputValidationError(EngineeringCalculationError, ValueError):
    """Raised when required engineering inputs are invalid."""


class UnsupportedCalculationError(EngineeringCalculationError, NotImplementedError):
    """Raised when the specification excludes a required calculation."""
