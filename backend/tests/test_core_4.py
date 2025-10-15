import pytest
from unittest.mock import MagicMock
from psra_backend.hs_codes import HSCodeService, HSCode
from psra_backend.database import get_db_session

# Factory pattern for test data
class HSCodeFactory:
    @staticmethod
    def create_valid_hs_code(code="123456", description="Test Product"):
        return HSCode(code=code, description=description)
    
    @staticmethod
    def create_invalid_hs_code():
        return HSCode(code="invalid", description="")

@pytest.fixture
def db_session():
    session = MagicMock()
    yield session
    session.close()

@pytest.fixture
def mock_api_client(mocker):
    client = mocker.patch("psra_backend.hs_codes.requests.get")
    client.return_value.json.return_value = {"description": "mocked"}
    return client

@pytest.fixture
def sample_hs_code():
    return HSCodeFactory.create_valid_hs_code()

@pytest.fixture
def sample_hs_codes():
    return [HSCodeFactory.create_valid_hs_code(f"{i}23456") for i in range(1, 6)]

def test_validate_hs_code_valid(sample_hs_code):
    service = HSCodeService(None)
    assert service.validate_hs_code(sample_hs_code.code) is True

def test_validate_hs_code_invalid():
    service = HSCodeService(None)
    assert service.validate_hs_code("abc") is False

def test_lookup_hs_code_by_code(db_session, sample_hs_code):
    db_session.query.return_value.filter.return_value.first.return_value = sample_hs_code
    service = HSCodeService(db_session)
    result = service.lookup_hs_code("123456")
    assert result.description == "Test Product"

def test_lookup_hs_code_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = HSCodeService(db_session)
    with pytest.raises(ValueError, match="HS code not found"):
        service.lookup_hs_code("999999")

@pytest.mark.asyncio
async def test_create_hs_code_success(db_session, sample_hs_code):
    service = HSCodeService(db_session)
    result = await service.create_hs_code(sample_hs_code)
    assert result.code == "123456"
    db_session.add.assert_called_once()

@pytest.mark.asyncio
async def test_create_hs_code_validation_error(db_session):
    service = HSCodeService(db_session)
    invalid_code = HSCodeFactory.create_invalid_hs_code()
    with pytest.raises(ValueError, match="Invalid HS code"):
        await service.create_hs_code(invalid_code)

@pytest.mark.asyncio
async def test_update_hs_code_success(db_session, sample_hs_code):
    db_session.query.return_value.filter.return_value.first.return_value = sample_hs_code
    service = HSCodeService(db_session)
    updated = await service.update_hs_code("123456", {"description": "Updated"})
    assert updated.description == "Updated"
    db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_update_hs_code_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = HSCodeService(db_session)
    with pytest.raises(ValueError, match="HS code not found"):
        await service.update_hs_code("999999", {"description": "New"})

def test_search_hs_codes_by_description(db_session, sample_hs_codes):
    db_session.query.return_value.filter.return_value.all.return_value = sample_hs_codes[:3]
    service = HSCodeService(db_session)
    results = service.search_hs_codes("Test")
    assert len(results) == 3

@pytest.mark.asyncio
async def test_bulk_create_hs_codes(db_session, sample_hs_codes):
    service = HSCodeService(db_session)
    results = await service.bulk_create_hs_codes(sample_hs_codes)
    assert len(results) == 5
    db_session.add_all.assert_called_once()

@pytest.mark.asyncio
async def test_lookup_with_external_api(mock_api_client, db_session):
    service = HSCodeService(db_session)
    result = await service.lookup_with_external_api("123456")
    assert "description" in result
    mock_api_client.assert_called_once()
