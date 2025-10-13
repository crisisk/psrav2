"""
Predictive Analytics Data Models

Pydantic models for predictive analytics requests and responses.
Complements the service-level dataclasses with API-focused models.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, validator


class RiskLevel(str, Enum):
    """Risk level classification."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplianceVerdict(str, Enum):
    """Compliance prediction verdict."""
    LIKELY_COMPLIANT = "LIKELY_COMPLIANT"
    UNCERTAIN = "UNCERTAIN"
    LIKELY_NON_COMPLIANT = "LIKELY_NON_COMPLIANT"


class PredictionConfidenceLevel(str, Enum):
    """Confidence level in predictions."""
    HIGH = "HIGH"          # >= 0.75
    MEDIUM = "MEDIUM"      # >= 0.50
    LOW = "LOW"            # < 0.50


class RiskFactor(BaseModel):
    """Individual risk factor contribution."""
    name: str = Field(..., description="Factor name")
    value: float = Field(..., description="Factor value")
    weight: float = Field(..., ge=0, le=1, description="Weight in overall calculation")
    impact: str = Field(..., description="Impact description")


class FeatureImportance(BaseModel):
    """Feature importance for ML explainability."""
    feature_name: str
    importance_score: float = Field(..., ge=0, le=1)
    description: str


class PredictionMetadata(BaseModel):
    """Metadata about prediction."""
    model_type: str = Field(..., description="Type of model used")
    model_version: str = Field(default="1.0")
    features_used: List[str] = Field(..., description="Features used in prediction")
    training_samples: int = Field(..., description="Number of samples model trained on")
    prediction_time_ms: Optional[float] = Field(None, description="Time taken for prediction")


class RiskScoreDetail(BaseModel):
    """Detailed risk score information."""
    overall_score: float = Field(..., ge=0, le=1, description="Overall risk score")
    confidence: float = Field(..., ge=0, le=1)
    confidence_level: PredictionConfidenceLevel
    risk_level: RiskLevel
    risk_factors: List[RiskFactor] = Field(default_factory=list)
    explanation: str
    recommendations: List[str] = Field(default_factory=list)
    metadata: Optional[PredictionMetadata] = None
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('confidence_level', always=True)
    def set_confidence_level(cls, v, values):
        """Automatically set confidence level based on confidence score."""
        if v:
            return v
        confidence = values.get('confidence', 0)
        if confidence >= 0.75:
            return PredictionConfidenceLevel.HIGH
        elif confidence >= 0.50:
            return PredictionConfidenceLevel.MEDIUM
        else:
            return PredictionConfidenceLevel.LOW


class ComplianceDetail(BaseModel):
    """Detailed compliance prediction information."""
    probability: float = Field(..., ge=0, le=1, description="Compliance probability")
    confidence: float = Field(..., ge=0, le=1)
    confidence_level: PredictionConfidenceLevel
    verdict: ComplianceVerdict
    qualified_agreements: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)
    compliance_factors: Dict[str, float] = Field(default_factory=dict)
    explanation: str
    feature_importance: List[FeatureImportance] = Field(default_factory=list)
    metadata: Optional[PredictionMetadata] = None
    predicted_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('confidence_level', always=True)
    def set_confidence_level(cls, v, values):
        """Automatically set confidence level."""
        if v:
            return v
        confidence = values.get('confidence', 0)
        if confidence >= 0.75:
            return PredictionConfidenceLevel.HIGH
        elif confidence >= 0.50:
            return PredictionConfidenceLevel.MEDIUM
        else:
            return PredictionConfidenceLevel.LOW


class GeographicRiskBreakdown(BaseModel):
    """Geographic risk breakdown by country."""
    country_code: str = Field(..., min_length=2, max_length=2)
    country_name: Optional[str] = None
    risk_score: float = Field(..., ge=0, le=1)
    material_count: int = Field(..., ge=0)
    value_percentage: float = Field(..., ge=0, le=100)
    risk_factors: List[str] = Field(default_factory=list)


class SupplierRiskProfile(BaseModel):
    """Supplier risk profile."""
    supplier_name: str
    country: str
    reliability_score: float = Field(..., ge=0, le=1)
    risk_score: float = Field(..., ge=0, le=1)
    years_in_business: Optional[int] = None
    certifications: List[str] = Field(default_factory=list)
    risk_indicators: List[str] = Field(default_factory=list)


class ComponentRiskDetail(BaseModel):
    """Detailed component risk information."""
    component_id: Optional[str] = None
    material_description: str
    hs_code: str
    origin_country: str
    risk_score: float = Field(..., ge=0, le=1)
    risk_level: RiskLevel
    value: float = Field(..., gt=0)
    value_percentage: float = Field(..., ge=0, le=100)
    risk_factors: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class SupplyChainRiskDetail(BaseModel):
    """Detailed supply chain risk analysis."""
    overall_risk_score: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    confidence_level: PredictionConfidenceLevel
    risk_level: RiskLevel

    # Risk breakdowns
    risk_breakdown: Dict[str, float] = Field(..., description="Risk by category")
    geographic_risks: List[GeographicRiskBreakdown] = Field(default_factory=list)
    supplier_risks: List[SupplierRiskProfile] = Field(default_factory=list)
    component_risks: List[ComponentRiskDetail] = Field(default_factory=list)

    # Analysis
    concentration_metrics: Dict[str, float] = Field(default_factory=dict)
    complexity_metrics: Dict[str, float] = Field(default_factory=dict)

    # Recommendations
    recommendations: List[str] = Field(default_factory=list)
    mitigation_strategies: List[str] = Field(default_factory=list)
    priority_actions: List[str] = Field(default_factory=list)

    # Explanation
    explanation: str
    metadata: Optional[PredictionMetadata] = None
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('confidence_level', always=True)
    def set_confidence_level(cls, v, values):
        """Automatically set confidence level."""
        if v:
            return v
        confidence = values.get('confidence', 0)
        if confidence >= 0.75:
            return PredictionConfidenceLevel.HIGH
        elif confidence >= 0.50:
            return PredictionConfidenceLevel.MEDIUM
        else:
            return PredictionConfidenceLevel.LOW

    @validator('risk_level', always=True)
    def set_risk_level(cls, v, values):
        """Automatically set risk level based on score."""
        if v:
            return v
        score = values.get('overall_risk_score', 0.5)
        if score >= 0.80:
            return RiskLevel.CRITICAL
        elif score >= 0.60:
            return RiskLevel.HIGH
        elif score >= 0.40:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW


class PredictiveInsight(BaseModel):
    """Predictive insight or recommendation."""
    insight_type: str = Field(..., description="Type: risk, opportunity, recommendation")
    title: str
    description: str
    confidence: float = Field(..., ge=0, le=1)
    priority: str = Field(..., description="Priority: high, medium, low")
    action_items: List[str] = Field(default_factory=list)
    impact_estimate: Optional[str] = None


class ModelPerformanceMetrics(BaseModel):
    """ML model performance metrics."""
    model_name: str
    accuracy: Optional[float] = Field(None, ge=0, le=1)
    precision: Optional[float] = Field(None, ge=0, le=1)
    recall: Optional[float] = Field(None, ge=0, le=1)
    f1_score: Optional[float] = Field(None, ge=0, le=1)
    training_samples: int
    last_trained: datetime
    features: List[str]


class BatchPredictionJob(BaseModel):
    """Batch prediction job status."""
    job_id: str
    status: str = Field(..., description="Status: pending, processing, completed, failed")
    total_items: int
    processed_items: int
    failed_items: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    results_url: Optional[str] = None
    error_message: Optional[str] = None


class PredictionAuditLog(BaseModel):
    """Audit log entry for predictions."""
    prediction_id: str
    prediction_type: str = Field(..., description="Type: risk_score, compliance, supply_chain")
    input_hash: str = Field(..., description="Hash of input data")
    output_score: float
    confidence: float
    model_version: str
    user_id: Optional[str] = None
    partner_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    execution_time_ms: float


class ThresholdAlert(BaseModel):
    """Alert triggered by threshold breach."""
    alert_type: str = Field(..., description="Type: high_risk, low_compliance, etc")
    severity: str = Field(..., description="Severity: critical, high, medium, low")
    threshold_value: float
    actual_value: float
    message: str
    affected_entity: str = Field(..., description="Entity ID that triggered alert")
    recommendations: List[str] = Field(default_factory=list)
    triggered_at: datetime = Field(default_factory=datetime.utcnow)


# Training and retraining models

class TrainingDataPoint(BaseModel):
    """Single training data point for model retraining."""
    features: Dict[str, float]
    label: int = Field(..., description="0 or 1 for binary classification")
    weight: float = Field(1.0, ge=0, description="Sample weight")
    metadata: Optional[Dict] = Field(default_factory=dict)


class ModelRetrainingRequest(BaseModel):
    """Request to retrain models with new data."""
    training_data: List[TrainingDataPoint] = Field(..., min_items=10)
    model_type: str = Field(..., description="Model to retrain: risk, compliance, both")
    validation_split: float = Field(0.2, ge=0.1, le=0.4)
    hyperparameters: Optional[Dict] = Field(default_factory=dict)


class ModelRetrainingResponse(BaseModel):
    """Response from model retraining."""
    job_id: str
    status: str
    training_samples: int
    validation_samples: int
    performance_metrics: Optional[ModelPerformanceMetrics] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


# Configuration models

class PredictionConfig(BaseModel):
    """Configuration for predictions."""
    confidence_threshold: float = Field(0.50, ge=0, le=1, description="Minimum confidence")
    risk_thresholds: Dict[str, float] = Field(
        default_factory=lambda: {
            "critical": 0.80,
            "high": 0.60,
            "medium": 0.40,
        }
    )
    enable_explainability: bool = Field(True, description="Include explanations")
    enable_recommendations: bool = Field(True, description="Include recommendations")
    max_recommendations: int = Field(5, ge=1, le=20)


class ServiceHealthStatus(BaseModel):
    """Health status of predictive analytics service."""
    status: str = Field(..., description="healthy, degraded, unhealthy")
    models_loaded: bool
    sklearn_available: bool
    models_trained: bool
    service_uptime_seconds: float
    total_predictions_served: int
    average_response_time_ms: float
    error_rate: float = Field(..., ge=0, le=1)
    last_health_check: datetime = Field(default_factory=datetime.utcnow)
    issues: List[str] = Field(default_factory=list)
