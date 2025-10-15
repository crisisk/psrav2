from fastapi import Request, Response
from fastapi.responses import JSONResponse
from .api_version import APIVersion, is_version_deprecated, get_sunset_date, get_deprecation_message
from typing import Optional
from datetime import datetime

def add_deprecation_headers(response: Response, version: APIVersion):
    """Add deprecation and sunset headers to the response per RFC 8594."""
    if is_version_deprecated(version):
        sunset_date = get_sunset_date(version)
        if sunset_date:
            response.headers["Sunset"] = sunset_date.strftime("%a, %d %b %Y %H:%M:%S GMT")
            # Link header pointing to migration guide (example URL)
            response.headers["Link"] = f'</docs/api/versioning-guide.md>; rel="sunset"; type="text/markdown"'
        response.headers["Deprecation"] = "true"
        response.headers["Warning"] = f'299 - "{get_deprecation_message(version)}"'

def create_deprecated_response(version: APIVersion, data: dict) -> JSONResponse:
    """Create a response with deprecation warnings."""
    response = JSONResponse(content=data)
    add_deprecation_headers(response, version)
    return response