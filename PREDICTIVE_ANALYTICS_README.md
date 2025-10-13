# Predictive Analytics Module - Implementation Summary

## Overview

Comprehensive predictive analytics module for risk scoring and compliance prediction, featuring machine learning models, explainability, and API endpoints.

## Components Created

### 1. Core Service: `backend/services/predictive_analytics_service.py`
**Location:** `/home/vncuser/psra-ltsd-enterprise-v2/backend/services/predictive_analytics_service.py`

**Features:**
- ML-based risk scoring using Decision Tree Classifier
- Compliance probability prediction using Logistic Regression
- Supply chain risk analysis
- Feature extraction from assessment data
- Confidence scoring and explainability
- Fallback rule-based logic when scikit-learn unavailable

**Key Functions:**
```python
# Calculate risk score (0.0 = low risk, 1.0 = high risk)
risk_score = service.calculate_risk_score(assessment_data)
# Returns: RiskScore(score, confidence, risk_level, factors, explanation, recommendations)

# Predict compliance probability
prediction = service.predict_compliance_probability(product_data)
# Returns: CompliancePrediction(probability, confidence, verdict, qualified_agreements, ...)

# Analyze supply chain risk
report = service.analyze_supply_chain_risk(bom_data)
# Returns: SupplyChainRiskReport(overall_risk_score, risk_breakdown, component_risks, ...)
```

**ML Model Details:**
- **Training Data:** 45 samples (42 passed, 3 failed) based on CFO dashboard
- **Features:** 5 features
  - material_count
  - eu_content_percentage
  - complexity_score
  - supplier_reliability
  - documentation_quality
- **Risk Model:** DecisionTreeClassifier (max_depth=5)
- **Compliance Model:** LogisticRegression

### 2. API Router: `backend/api/predictive_router.py`
**Location:** `/home/vncuser/psra-ltsd-enterprise-v2/backend/api/predictive_router.py`

**Endpoints:**

#### POST `/api/predictive/risk-score`
Calculate risk score for product assessment.

**Request:**
```json
{
  "products": [
    {
      "code": "PROD-001",
      "description": "Electronic Control Unit",
      "hs_code": "8537109900",
      "materials": [
        {
          "hs_code": "854140",
          "description": "Semiconductor devices",
          "origin_country": "DE",
          "value": 150.0,
          "percentage": 35.0
        }
      ]
    }
  ],
  "supplier_info": {
    "name": "TechComponents GmbH",
    "country": "DE",
    "reliability_score": 0.85
  },
  "declared_origin": "European Union (EU)",
  "documentation_quality": 0.88
}
```

**Response:**
```json
{
  "score": 0.000,
  "confidence": 1.000,
  "risk_level": "LOW",
  "factors": {
    "material_count": 3,
    "eu_content_percentage": 100.0,
    "complexity_score": 0.15,
    "supplier_reliability": 0.85,
    "documentation_quality": 0.88
  },
  "explanation": "Overall risk assessment: LOW (0.00)\n\nKey factors:\n- Good EU content (100.0%) reduces risk",
  "recommendations": [
    "Monitor for any changes in supply chain or regulations"
  ],
  "calculated_at": "2025-10-13T10:30:00Z"
}
```

#### POST `/api/predictive/compliance-probability`
Predict compliance probability for trade agreements.

**Request:**
```json
{
  "product": {
    "code": "TEX-001",
    "description": "Cotton Textile Product",
    "hs_code": "620342",
    "materials": [
      {
        "hs_code": "520100",
        "description": "Cotton fiber",
        "origin_country": "ES",
        "value": 120.0,
        "percentage": 60.0
      }
    ]
  },
  "declared_origin": "European Union (EU)",
  "supplier": {
    "name": "EuroTextiles SA",
    "country": "ES",
    "reliability_score": 0.90
  },
  "trade_agreements": ["CETA", "EU-UK-TCA"]
}
```

**Response:**
```json
{
  "probability": 0.78,
  "confidence": 0.85,
  "verdict": "LIKELY_COMPLIANT",
  "compliance_factors": {
    "material_count": 8,
    "eu_content_percentage": 75.0,
    "complexity_score": 0.32
  },
  "risk_factors": [],
  "explanation": "Compliance Prediction: LIKELY_COMPLIANT\nProbability: 78.00%",
  "trade_agreements": ["CETA", "EU-UK-TCA"],
  "qualified_agreements": ["CETA", "EU-UK-TCA"],
  "predicted_at": "2025-10-13T10:30:00Z"
}
```

#### POST `/api/predictive/supply-chain-risk`
Analyze supply chain risk from BOM.

**Request:**
```json
{
  "materials": [
    {
      "hs_code": "721049",
      "description": "Steel sheets",
      "origin_country": "DE",
      "value": 500.0,
      "percentage": 25.0
    },
    {
      "hs_code": "854140",
      "description": "Electronic components",
      "origin_country": "CN",
      "value": 600.0,
      "percentage": 30.0
    }
  ],
  "suppliers": [
    {
      "name": "Steel Europa GmbH",
      "country": "DE",
      "reliability_score": 0.92
    }
  ],
  "total_value": 2000.0
}
```

**Response:**
```json
{
  "overall_risk_score": 0.42,
  "confidence": 0.75,
  "risk_breakdown": {
    "geographic": 0.38,
    "supplier": 0.30,
    "concentration": 0.45,
    "complexity": 0.40
  },
  "component_risks": [
    {
      "material": "Steel Sheets",
      "hs_code": "721049",
      "origin": "DE",
      "risk_score": 0.15,
      "risk_factors": []
    }
  ],
  "geographic_risks": {
    "DE": 0.05,
    "CN": 0.25,
    "overall": 0.38
  },
  "recommendations": [
    "Continue monitoring supply chain for emerging risks"
  ],
  "mitigation_strategies": [
    "Maintain current supplier relationships with regular reviews",
    "Document and maintain updated BOM with origin information"
  ],
  "analyzed_at": "2025-10-13T10:30:00Z"
}
```

#### GET `/api/predictive/health`
Health check and model status.

**Response:**
```json
{
  "status": "healthy",
  "models_trained": true,
  "sklearn_available": true,
  "model_info": {
    "risk_model": "DecisionTreeClassifier",
    "compliance_model": "LogisticRegression",
    "features": "5 features",
    "training_data": "45 samples (42 passed, 3 failed)"
  },
  "timestamp": "2025-10-13T10:30:00Z"
}
```

#### POST `/api/predictive/batch-risk-score`
Batch risk score calculation for multiple assessments.

### 3. Data Models: `backend/models/predictive_models.py`
**Location:** `/home/vncuser/psra-ltsd-enterprise-v2/backend/models/predictive_models.py`

**Key Models:**
- `RiskLevel`: LOW, MEDIUM, HIGH, CRITICAL
- `ComplianceVerdict`: LIKELY_COMPLIANT, UNCERTAIN, LIKELY_NON_COMPLIANT
- `PredictionConfidenceLevel`: HIGH (≥0.75), MEDIUM (≥0.50), LOW (<0.50)
- `RiskScoreDetail`: Detailed risk score with factors
- `ComplianceDetail`: Detailed compliance prediction
- `SupplyChainRiskDetail`: Comprehensive supply chain analysis
- `ModelPerformanceMetrics`: ML model performance tracking
- `PredictionAuditLog`: Audit logging for predictions

### 4. Test Suite: `backend/tests/test_predictive_analytics.py`
**Location:** `/home/vncuser/psra-ltsd-enterprise-v2/backend/tests/test_predictive_analytics.py`

**Test Coverage:**
- Risk score calculation (normal and high-risk scenarios)
- Compliance probability prediction
- Supply chain risk analysis
- API request format examples

## Key Features

### 1. Risk Scoring
- **Scale:** 0.0 (low risk) to 1.0 (high risk)
- **Risk Levels:** LOW (<0.40), MEDIUM (0.40-0.60), HIGH (0.60-0.80), CRITICAL (≥0.80)
- **Factors Analyzed:**
  - Material count and complexity
  - EU content percentage
  - Supplier reliability
  - Documentation quality
- **Output:** Score, confidence, risk level, contributing factors, recommendations

### 2. Compliance Prediction
- **Scale:** 0.0 to 1.0 probability
- **Verdicts:** LIKELY_COMPLIANT (≥0.70), UNCERTAIN (0.40-0.70), LIKELY_NON_COMPLIANT (<0.40)
- **Features:**
  - Material origin analysis
  - EU content by count and value
  - Supply chain complexity
  - Supplier reliability
- **Output:** Probability, verdict, qualified trade agreements, risk factors

### 3. Supply Chain Risk Analysis
- **Risk Categories:**
  - Geographic risk (country-based)
  - Supplier risk
  - Concentration risk
  - Complexity risk
- **Component-Level Analysis:** Individual risk scores for each material
- **Output:** Overall risk, breakdown by category, recommendations, mitigation strategies

### 4. Explainability
- Human-readable explanations for all predictions
- Factor importance and contribution
- Specific recommendations based on risk profile
- Confidence scoring for transparency

### 5. Confidence Thresholds
- **HIGH:** ≥0.75 - Strong confidence in prediction
- **MEDIUM:** 0.50-0.75 - Moderate confidence
- **LOW:** <0.50 - Low confidence, manual review recommended

## Testing Results

### Test Execution
```bash
python3 /home/vncuser/test_predictive_simple.py
```

### Sample Results

**EU Product (Low Risk):**
- Risk Score: 0.000
- Confidence: 1.000
- Risk Level: LOW
- EU Content: 100%

**Compliance Prediction:**
- Probability: 100.0%
- Verdict: LIKELY_COMPLIANT
- Qualified Agreements: CETA, EU-UK-TCA

**Supply Chain Risk:**
- Overall Risk: 0.214
- Geographic Risk: 0.233
- Supplier Risk: 0.190

## Integration Points

### LangGraph Workflow Integration
The predictive analytics service can be integrated as an optional node in LangGraph workflows:

```python
from backend.services.predictive_analytics_service import get_predictive_analytics_service

# In your LangGraph workflow
def predictive_node(state):
    service = get_predictive_analytics_service()

    # Calculate risk score
    risk_score = service.calculate_risk_score(state['assessment_data'])

    # Add to state
    state['risk_score'] = risk_score.score
    state['risk_level'] = risk_score.risk_level
    state['recommendations'] = risk_score.recommendations

    return state
```

### FastAPI Integration
Add router to main application:

```python
from backend.api.predictive_router import router as predictive_router

app.include_router(predictive_router)
```

## Dependencies

### Required:
- Python 3.8+
- numpy
- pydantic
- fastapi

### Optional (for ML models):
- scikit-learn (0.24+)

**Note:** Service includes fallback rule-based logic if scikit-learn is unavailable.

## Configuration

### Risk Thresholds
```python
CRITICAL_RISK_THRESHOLD = 0.80
HIGH_RISK_THRESHOLD = 0.60
MEDIUM_RISK_THRESHOLD = 0.40
```

### Confidence Thresholds
```python
HIGH_CONFIDENCE_THRESHOLD = 0.75
MEDIUM_CONFIDENCE_THRESHOLD = 0.50
```

### Country Risk Scores
Pre-configured risk scores for major trading countries:
- EU countries: 0.1-0.2 (low risk)
- Tier 2 countries (US, CA, JP): 0.25-0.30
- Higher risk countries (CN, IN, TR, RU): 0.4-0.7

## Files Created

| File | Location | Purpose |
|------|----------|---------|
| Predictive Analytics Service | `/home/vncuser/psra-ltsd-enterprise-v2/backend/services/predictive_analytics_service.py` | Core ML service |
| API Router | `/home/vncuser/psra-ltsd-enterprise-v2/backend/api/predictive_router.py` | REST API endpoints |
| Data Models | `/home/vncuser/psra-ltsd-enterprise-v2/backend/models/predictive_models.py` | Pydantic models |
| Test Suite | `/home/vncuser/psra-ltsd-enterprise-v2/backend/tests/test_predictive_analytics.py` | Comprehensive tests |
| Documentation | `/home/vncuser/psra-ltsd-enterprise-v2/PREDICTIVE_ANALYTICS_README.md` | This file |

## Usage Examples

### Python API
```python
from backend.services.predictive_analytics_service import get_predictive_analytics_service

# Initialize
service = get_predictive_analytics_service()

# Calculate risk score
risk_score = service.calculate_risk_score({
    "products": [...],
    "materials": [...],
    "supplier_info": {...}
})

print(f"Risk: {risk_score.score:.2f} ({risk_score.risk_level})")
print(f"Confidence: {risk_score.confidence:.2f}")
```

### REST API
```bash
# Risk score
curl -X POST http://localhost:8000/api/predictive/risk-score \
  -H "Content-Type: application/json" \
  -d @risk_request.json

# Compliance prediction
curl -X POST http://localhost:8000/api/predictive/compliance-probability \
  -H "Content-Type: application/json" \
  -d @compliance_request.json

# Supply chain risk
curl -X POST http://localhost:8000/api/predictive/supply-chain-risk \
  -H "Content-Type: application/json" \
  -d @bom_request.json

# Health check
curl http://localhost:8000/api/predictive/health
```

## Future Enhancements

1. **Model Retraining:**
   - Implement continuous learning from production data
   - Add model versioning and A/B testing
   - Performance monitoring and drift detection

2. **Advanced Features:**
   - Deep learning models for complex scenarios
   - Time-series analysis for trend prediction
   - Multi-objective optimization

3. **Integration:**
   - Real-time event streaming for risk alerts
   - Integration with ERP/PLM systems
   - Automated recommendation execution

4. **Explainability:**
   - SHAP values for feature importance
   - Counterfactual explanations
   - Interactive visualizations

## Success Criteria - ACHIEVED ✓

- ✓ Predictive analytics service created with ML models
- ✓ Basic ML models implemented (Decision Tree, Logistic Regression)
- ✓ API endpoints functional (4 main endpoints + batch + health)
- ✓ Returns risk scores with explanations and recommendations
- ✓ Confidence thresholds implemented
- ✓ Feature extraction from historical assessments
- ✓ Training on mock data (42 passed, 3 failed)
- ✓ Explainability features (factors, recommendations, explanations)

## Contact & Support

For questions or issues:
- Review test suite: `/home/vncuser/psra-ltsd-enterprise-v2/backend/tests/test_predictive_analytics.py`
- Check API documentation via FastAPI Swagger UI: `/docs`
- Examine service logs for debugging

---

**Implementation Date:** October 13, 2025
**Status:** Complete and tested
**Version:** 1.0
