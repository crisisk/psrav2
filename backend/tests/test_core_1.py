import pytest
from unittest.mock import MagicMock
from psra_backend.certificates import CertificateService, Certificate
from psra_backend.database import get_db_session

# Factory pattern for test data
class CertificateFactory:
    @staticmethod
    def create_valid_certificate(id=1, name="Test Cert", status="valid"):
        return Certificate(id=id, name=name, status=status)
    
    @staticmethod
    def create_invalid_certificate():
        return Certificate(id=2, name="", status="invalid")

@pytest.fixture
def db_session():
    session = MagicMock()
    yield session
    session.close()

@pytest.fixture
def mock_api_client(mocker):
    client = mocker.patch("psra_backend.certificates.requests.post")
    client.return_value.status_code = 200
    return client

@pytest.fixture
def sample_certificate():
    return CertificateFactory.create_valid_certificate()

@pytest.fixture
def sample_certificates():
    return [CertificateFactory.create_valid_certificate(i, f"Cert {i}") for i in range(1, 6)]

@pytest.mark.asyncio
async def test_create_certificate_success(db_session, sample_certificate):
    service = CertificateService(db_session)
    result = await service.create_certificate(sample_certificate)
    assert result.id == 1
    db_session.add.assert_called_once()

@pytest.mark.asyncio
async def test_create_certificate_validation_error(db_session):
    service = CertificateService(db_session)
    invalid_cert = CertificateFactory.create_invalid_certificate()
    with pytest.raises(ValueError, match="Invalid certificate name"):
        await service.create_certificate(invalid_cert)

def test_read_certificate_by_id(db_session, sample_certificate):
    db_session.query.return_value.filter.return_value.first.return_value = sample_certificate
    service = CertificateService(db_session)
    result = service.get_certificate_by_id(1)
    assert result.name == "Test Cert"

def test_read_certificate_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = CertificateService(db_session)
    with pytest.raises(ValueError, match="Certificate not found"):
        service.get_certificate_by_id(999)

@pytest.mark.asyncio
async def test_update_certificate_success(db_session, sample_certificate):
    db_session.query.return_value.filter.return_value.first.return_value = sample_certificate
    service = CertificateService(db_session)
    updated = await service.update_certificate(1, {"status": "expired"})
    assert updated.status == "expired"
    db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_update_certificate_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = CertificateService(db_session)
    with pytest.raises(ValueError, match="Certificate not found"):
        await service.update_certificate(999, {"status": "valid"})

@pytest.mark.asyncio
async def test_delete_certificate_success(db_session, sample_certificate):
    db_session.query.return_value.filter.return_value.first.return_value = sample_certificate
    service = CertificateService(db_session)
    await service.delete_certificate(1)
    db_session.delete.assert_called_once()
    db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_delete_certificate_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = CertificateService(db_session)
    with pytest.raises(ValueError, match="Certificate not found"):
        await service.delete_certificate(999)

def test_validate_certificate_valid(sample_certificate):
    service = CertificateService(None)
    assert service.validate_certificate(sample_certificate) is True

def test_validate_certificate_invalid():
    service = CertificateService(None)
    invalid_cert = CertificateFactory.create_invalid_certificate()
    assert service.validate_certificate(invalid_cert) is False

@pytest.mark.asyncio
async def test_bulk_create_certificates(db_session, sample_certificates):
    service = CertificateService(db_session)
    results = await service.bulk_create_certificates(sample_certificates)
    assert len(results) == 5
    db_session.add_all.assert_called_once()

def test_list_certificates_paginated(db_session, sample_certificates):
    db_session.query.return_value.offset.return_value.limit.return_value.all.return_value = sample_certificates[:3]
    service = CertificateService(db_session)
    results = service.list_certificates(page=1, limit=3)
    assert len(results) == 3
