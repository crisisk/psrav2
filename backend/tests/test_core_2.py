import pytest
from unittest.mock import MagicMock
from psra_backend.evaluations import EvaluationService, ComplianceEvaluation
from psra_backend.database import get_db_session

# Factory pattern for test data
class EvaluationFactory:
    @staticmethod
    def create_compliant_evaluation(id=1, product_id=100, score=95):
        return ComplianceEvaluation(id=id, product_id=product_id, score=score, compliant=True)
    
    @staticmethod
    def create_non_compliant_evaluation():
        return ComplianceEvaluation(id=2, product_id=101, score=50, compliant=False)

@pytest.fixture
def db_session():
    session = MagicMock()
    yield session
    session.close()

@pytest.fixture
def mock_api_client(mocker):
    client = mocker.patch("psra_backend.evaluations.requests.get")
    client.return_value.json.return_value = {"data": "mocked"}
    return client

@pytest.fixture
def sample_evaluation():
    return EvaluationFactory.create_compliant_evaluation()

@pytest.fixture
def sample_evaluations():
    return [EvaluationFactory.create_compliant_evaluation(i, 100 + i) for i in range(1, 6)]

@pytest.mark.asyncio
async def test_evaluate_compliance_success(db_session, sample_evaluation):
    service = EvaluationService(db_session)
    result = await service.evaluate_compliance(100)
    assert result.compliant is True
    db_session.add.assert_called_once()

@pytest.mark.asyncio
async def test_evaluate_compliance_failure(db_session):
    service = EvaluationService(db_session)
    with pytest.raises(RuntimeError, match="Evaluation failed"):
        await service.evaluate_compliance(999)  # Simulate failure

def test_get_evaluation_by_id(db_session, sample_evaluation):
    db_session.query.return_value.filter.return_value.first.return_value = sample_evaluation
    service = EvaluationService(db_session)
    result = service.get_evaluation_by_id(1)
    assert result.score == 95

def test_get_evaluation_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = EvaluationService(db_session)
    with pytest.raises(ValueError, match="Evaluation not found"):
        service.get_evaluation_by_id(999)

@pytest.mark.asyncio
async def test_update_evaluation_score(db_session, sample_evaluation):
    db_session.query.return_value.filter.return_value.first.return_value = sample_evaluation
    service = EvaluationService(db_session)
    updated = await service.update_evaluation(1, {"score": 100})
    assert updated.score == 100
    db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_update_evaluation_not_found(db_session):
    db_session.query.return_value.filter.return_value.first.return_value = None
    service = EvaluationService(db_session)
    with pytest.raises(ValueError, match="Evaluation not found"):
        await service.update_evaluation(999, {"score": 90})

def test_calculate_compliance_score_compliant():
    service = EvaluationService(None)
    score = service.calculate_compliance_score({"criteria": "met"})
    assert score >= 80

def test_calculate_compliance_score_non_compliant():
    service = EvaluationService(None)
    score = service.calculate_compliance_score({"criteria": "not met"})
    assert score < 80

@pytest.mark.asyncio
async def test_bulk_evaluate_products(db_session, sample_evaluations):
    service = EvaluationService(db_session)
    results = await service.bulk_evaluate_products([100, 101, 102])
    assert len(results) == 3
    db_session.add_all.assert_called_once()

def test_list_evaluations_by_product(db_session, sample_evaluations):
    db_session.query.return_value.filter.return_value.all.return_value = sample_evaluations
    service = EvaluationService(db_session)
    results = service.list_evaluations_by_product(100)
    assert len(results) == 5

@pytest.mark.asyncio
async def test_evaluate_with_external_api(mock_api_client, db_session):
    service = EvaluationService(db_session)
    result = await service.evaluate_with_external_data(100)
    assert "data" in result
    mock_api_client.assert_called_once()
