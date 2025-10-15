import json
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.middleware.request_validator import add_request_validator
from app.core.validation_rules import MAX_JSON_DEPTH, MAX_ARRAY_LENGTH, MAX_STRING_LENGTH

app = FastAPI()
add_request_validator(app)

client = TestClient(app)

@app.get("/test")
async def test_endpoint():
    return {"message": "OK"}

def test_request_body_size_limit():
    large_body = "x" * (10 * 1024 * 1024 + 1)  # Exceeds 10MB
    response = client.post("/test", data=large_body)
    assert response.status_code == 400
    assert "Request body exceeds maximum size" in response.json()["error"]

def test_header_size_limit():
    long_header = "x" * (MAX_STRING_LENGTH + 1)
    response = client.get("/test", headers={"test": long_header})
    assert response.status_code == 400
    assert "Header validation failed" in response.json()["error"]

def test_query_param_validation():
    long_param = "x" * 1001  # Exceeds max
    response = client.get("/test", params={"param": long_param})
    assert response.status_code == 400
    assert "Query parameter validation failed" in response.json()["error"]

def test_file_upload_limit():
    # Simulate file upload exceeding 100MB (use small file for test)
    files = {"file": ("test.jpg", b"x" * (100 * 1024 * 1024 + 1), "image/jpeg")}
    response = client.post("/test", files=files)
    assert response.status_code == 400
    assert "exceeds maximum size" in response.json()["error"]

def test_file_type_validation():
    files = {"file": ("test.txt", b"content", "text/plain")}
    response = client.post("/test", files=files)
    assert response.status_code == 400
    assert "not allowed" in response.json()["error"]

def test_json_depth_limit():
    deep_json = {"level": {}}
    for i in range(MAX_JSON_DEPTH + 1):
        deep_json = {"level": deep_json}
    response = client.post("/test", json=deep_json)
    assert response.status_code == 400
    assert "JSON depth exceeds maximum" in response.json()["error"]

def test_array_length_limit():
    long_array = list(range(MAX_ARRAY_LENGTH + 1))
    response = client.post("/test", json={"array": long_array})
    assert response.status_code == 400
    assert "Array length exceeds maximum" in response.json()["error"]

def test_valid_request():
    response = client.get("/test", params={"param": "valid"})
    assert response.status_code == 200
    assert response.json() == {"message": "OK"}