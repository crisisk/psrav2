from enum import Enum
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class APIVersion(Enum):
    V1 = "v1"
    V2 = "v2"
    # Add future versions here, e.g., V3 = "v3"

class VersionStatus(Enum):
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    SUNSET = "sunset"  # No longer supported

# Version compatibility matrix: Maps each version to its status and compatible versions
VERSION_MATRIX: Dict[APIVersion, Dict[str, any]] = {
    APIVersion.V1: {
        "status": VersionStatus.DEPRECATED,
        "compatible_with": [APIVersion.V1],
        "sunset_date": datetime(2024, 12, 31),  # Example sunset date
        "deprecation_message": "API v1 is deprecated. Migrate to v2 by Q1 2025.",
    },
    APIVersion.V2: {
        "status": VersionStatus.ACTIVE,
        "compatible_with": [APIVersion.V1, APIVersion.V2],  # v2 can handle v1 requests if needed
        "sunset_date": None,
        "deprecation_message": None,
    },
}

def get_version_from_string(version_str: str) -> Optional[APIVersion]:
    """Convert a string (e.g., 'v1') to APIVersion enum."""
    try:
        return APIVersion(version_str.lower())
    except ValueError:
        return None

def is_version_deprecated(version: APIVersion) -> bool:
    """Check if a version is deprecated or sunset."""
    status = VERSION_MATRIX[version]["status"]
    return status in [VersionStatus.DEPRECATED, VersionStatus.SUNSET]

def get_sunset_date(version: APIVersion) -> Optional[datetime]:
    """Get the sunset date for a version."""
    return VERSION_MATRIX[version]["sunset_date"]

def get_deprecation_message(version: APIVersion) -> Optional[str]:
    """Get the deprecation message for a version."""
    return VERSION_MATRIX[version]["deprecation_message"]