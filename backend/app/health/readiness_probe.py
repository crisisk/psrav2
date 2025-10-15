# This module is integrated into health_checks.py for simplicity.
# If needed separately, it can be expanded for custom readiness logic.
# For now, it's a placeholder to match the file list.

from .health_checks import readiness_probe

# Expose the readiness probe function
def get_readiness_probe():
    return readiness_probe