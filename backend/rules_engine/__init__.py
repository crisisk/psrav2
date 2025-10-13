"""Deterministic rules engine entry points."""

from .origin import evaluate_origin, OriginEvaluationError

__all__ = ["evaluate_origin", "OriginEvaluationError"]
