from fastapi import APIRouter, Request, HTTPException
from fastapi.routing import APIRoute
from .api_version import APIVersion, get_version_from_string, VERSION_MATRIX
from .deprecation import add_deprecation_headers
from typing import Dict, Callable
import re

class VersionedAPIRouter(APIRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.versioned_routes: Dict[str, Dict[APIVersion, Callable]] = {}

    def add_versioned_route(self, path: str, endpoint: Callable, methods: list, version: APIVersion):
        """Add a versioned route."""
        if path not in self.versioned_routes:
            self.versioned_routes[path] = {}
        self.versioned_routes[path][version] = endpoint

        # Register the route with URL prefix (e.g., /api/v1/path)
        prefixed_path = f"/api/{version.value}{path}"
        super().add_route(prefixed_path, endpoint, methods=methods, name=f"{version.value}_{path}")

    async def dispatch(self, request: Request, call_next):
        """Override dispatch to handle header-based negotiation and automatic routing."""
        # Extract version from URL (e.g., /api/v1/...)
        url_version_match = re.match(r"/api/(v\d+)/", request.url.path)
        if url_version_match:
            version_str = url_version_match.group(1)
            version = get_version_from_string(version_str)
        else:
            # Fallback to header: Accept-Version
            version_str = request.headers.get("Accept-Version", "v2")  # Default to latest
            version = get_version_from_string(version_str)

        if not version or version not in VERSION_MATRIX:
            raise HTTPException(status_code=400, detail="Invalid API version")

        # Route to the versioned endpoint if it exists
        path_without_version = re.sub(r"/api/v\d+", "", request.url.path)
        if path_without_version in self.versioned_routes and version in self.versioned_routes[path_without_version]:
            # Simulate routing by calling the endpoint directly (in a real setup, adjust FastAPI routing)
            endpoint = self.versioned_routes[path_without_version][version]
            response = await endpoint(request)
            if isinstance(response, dict):  # Assuming endpoint returns dict; wrap in JSONResponse
                from fastapi.responses import JSONResponse
                response = JSONResponse(content=response)
            add_deprecation_headers(response, version)
            return response
        else:
            raise HTTPException(status_code=404, detail="Endpoint not found for this version")

        # For non-versioned routes, proceed normally
        return await call_next(request)