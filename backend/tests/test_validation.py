# /home/vncuser/psra-ltsd-enterprise-v2/backend/tests/test_validation.py
import pytest
import sys
import os
from pydantic import ValidationError
from app.schemas import CertificateCreate, CertificateResponse  # Assuming schemas

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Test: Valid Pydantic model
def test_valid_certificate_model():
    data = {
        "name": "Valid Cert",
        "issuer": "Issuer",
        "valid_from": "2023-01-01T00:00:00Z",
        "valid_to": "2024-01-01T00:00:00Z",
        "status": "valid"
    }
    try:
        cert = CertificateCreate(**data)
        assert cert.name == "Valid Cert"
    except ValidationError as e:
        pytest.fail(f"Unexpected validation error: {e}")

# Test: Invalid Pydantic model (missing required field)
def test_invalid_certificate_model_missing_field():
    data = {
        "issuer": "Issuer",
        "valid_from": "2023-01-01T00:00:00Z",
        "valid_to": "2024-01-01T00:00:00Z",
        "status": "valid"
    }
    with pytest.raises(ValidationError):
        CertificateCreate(**data)

# Test: Invalid Pydantic model (wrong type)
def test_invalid_certificate_model_wrong_type():
    data = {
        "name": 123,  # Should be string
        "issuer": "Issuer",
        "valid_from": "2023-01-01T00:00:00Z",
        "valid_to": "2024-01-01T00:00:00Z",
        "status": "valid"
    }
    with pytest.raises(ValidationError):
        CertificateCreate(**data)

# Test: Edge case - empty string
def test_certificate_model_empty_string():
    data = {
        "name": "",
        "issuer": "Issuer",
        "valid_from": "2023-01-01T00:00:00Z",
        "valid_to": "2024-01-01T00:00:00Z",
        "status": "valid"
    }
    try:
        cert = CertificateCreate(**data)
        assert cert.name == ""
    except ValidationError as e:
        pytest.fail(f"Unexpected validation error for empty string: {e}")
