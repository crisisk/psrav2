import pytest
from unittest.mock import MagicMock
from psra_backend.rules import RuleService, ComplianceRule
from psra_backend.database import get_db_session

# Factory pattern for test data
class RuleFactory:
    @staticmethod
    def create_matching_rule(id=1, condition="score > 80", action="approve"):
        return ComplianceRule(id=id, condition=condition, action=action)
    
    @staticmethod
    def create_non_matching_rule():
        return ComplianceRule(id=2, condition="score < 50", action="reject")

@pytest.fixture
def db_session():
    session = MagicMock()
    yield session
    session.close()

@pytest.fixture
def mock_api_client(mocker):
    client = mocker.patch("psra_backend.rules.requests.post")
    client.return_value.status_code = 200
    return client

@pytest.fixture
def sample_rule():
    return RuleFactory.create_matching_rule()

@pytest.fixture
def sample_rules():
    return [RuleFactory.create_matching_rule(i, f"condition {i}") for i in range(1, 6)]

def test_apply_rule_matching(sample_rule):
    service = RuleService(None)
    result = service.apply_rule(sample_rule, {"score": 85})
    assert result == "approve"

def test_apply_rule_not_matching(sample_rule):
    service = RuleService(None)
    result = service.apply_rule(sample_rule, {"score": 70})
    assert result is None

@pytest.mark.asyncio
async def test_create_rule_success(db_session, sample_rule):
    service = RuleService(db_session)
    result = await service.create_rule(sample_rule)
    assert result.id == 1
    db_session.add.assert_called_once()

@pytest.mark.asyncio
async def test_create_rule_validation_error(db_session):
    service = RuleService(db_session)
    invalid_rule = ComplianceRule(id=3, condition="", action="invalid")
    with pytest.raises(ValueError, match="Invalid rule condition"):
        await service.create_rule(invalid_rule)

def test_get_rule_by_id(db_session, sample_rule):
    db_session.query.return_value.filter.return_value.first.return_value = sample_rule
    service = RuleService(db_session)
    result = service.get_rule_by_id(1)
    assert result.action == "approve"

def test_get_rule_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = RuleService(db_session)
    with pytest.raises(ValueError, match="Rule not found"):
        service.get_rule_by_id(999)

@pytest.mark.asyncio
async def test_update_rule_success(db_session, sample_rule):
    db_session.query.return_value.filter.return_value.first.return_value = sample_rule
    service = RuleService(db_session)
    updated = await service.update_rule(1, {"action": "reject"})
    assert updated.action == "reject"
    db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_update_rule_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = RuleService(db_session)
    with pytest.raises(ValueError, match="Rule not found"):
        await service.update_rule(999, {"action": "approve"})

def test_match_rules_multiple(sample_rules):
    service = RuleService(None)
    matches = service.match_rules(sample_rules, {"score": 85})
    assert len(matches) > 0

def test_match_rules_none(sample_rules):
    service = RuleService(None)
    matches = service.match_rules(sample_rules, {"score": 40})
    assert len(matches) == 0

@pytest.mark.asyncio
async def test_bulk_apply_rules(db_session, sample_rules):
    service = RuleService(db_session)
    results = await service.bulk_apply_rules(sample_rules, [{"score": 85}, {"score": 70}])
    assert len(results) == 2
