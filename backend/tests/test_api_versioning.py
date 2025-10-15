import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.versioning.api_version import APIVersion, get_version_from_string, is_version_deprecated
from app.versioning.version_router import VersionedAPIRouter
from app.versioning.deprecation import create_deprecated_response

app = FastAPI()
router = VersionedAPIRouter()

# Mock endpoints
async def v1_endpoint(request):
    return {"message": "v1 response"}

async def v2_endpoint(request):
    return {"message": "v2 response"}

router.add_versioned_route("/test", v1_endpoint, ["GET"], APIVersion.V1)
router.add_versioned_route("/test", v2_endpoint, ["GET"], APIVersion.V2)
app.include_router(router)

client = TestClient(app)

def test_get_version_from_string():
    assert get_version_from_string("v1") == APIVersion.V1
    assert get_version_from_string("v2") == APIVersion.V2
    assert get_version_from_string("invalid") is None

def test_is_version_deprecated():
    assert is_version_deprecated(APIVersion.V1) is True
    assert is_version_deprecated(APIVersion.V2) is False

def test_url_based_versioning():
    response = client.get("/api/v1/test")
    assert response.status_code == 200
    assert "Deprecation" in response.headers
    assert response.json() == {"message": "v1 response"}

    response = client.get("/api/v2/test")
    assert response.status_code == 200
    assert "Deprecation" not in response.headers
    assert response.json() == {"message": "v2 response"}

def test_header_based_versioning():
    response = client.get("/api/test", headers={"Accept-Version": "v1"})
    assert response.status_code == 200
    assert "Deprecation" in response.headers

def test_invalid_version():
    response = client.get("/api/v3/test")
    assert response.status_code == 400

def test_deprecated_response():
    response = create_deprecated_response(APIVersion.V1, {"data": "test"})
    assert response.headers["Deprecation"] == "true"
    assert "Sunset" in response.headers