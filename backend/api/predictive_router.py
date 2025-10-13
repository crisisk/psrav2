"""
Predictive Analytics API Router

REST API endpoints for predictive analytics and risk scoring.

Endpoints:
- POST /api/predictive/risk-score - Calculate risk score for assessment
- POST /api/predictive/compliance-probability - Predict compliance probability
- POST /api/predictive/supply-chain-risk - Analyze supply chain risk
- GET /api/predictive/health - Health check and model status
"""

from __future__ import annotations

from typing import Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator

from backend.services.predictive_analytics_service import (
    get_predictive_analytics_service,
    RiskScore,
    CompliancePrediction,
    SupplyChainRiskReport,
)


router = APIRouter(prefix="/api/predictive", tags=["Predictive Analytics"])


# Request Models

class MaterialData(BaseModel):
    """Material/component data for analysis."""
    hs_code: str = Field(..., pattern=r"^\d{6,10}$", description="HS code")
    description: str = Field(..., min_length=1, max_length=255)
    origin_country: str = Field(..., min_length=2, max_length=2, description="ISO 2-letter country code")
    value: float = Field(..., gt=0, description="Material value")
    percentage: Optional[float] = Field(None, ge=0, le=100, description="Percentage of total value")


class ProductData(BaseModel):
    """Product data for analysis."""
    code: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    hs_code: str = Field(..., pattern=r"^\d{6,10}$")
    materials: List[MaterialData] = Field(default_factory=list)
    ex_works_value: Optional[float] = Field(None, gt=0)


class SupplierInfo(BaseModel):
    """Supplier information for risk assessment."""
    name: str = Field(..., min_length=3, max_length=255)
    country: str = Field(..., min_length=2, max_length=2)
    reliability_score: Optional[float] = Field(0.7, ge=0, le=1)
    vat_number: Optional[str] = None
    years_in_business: Optional[int] = None


class RiskScoreRequest(BaseModel):
    """Request for risk score calculation."""
    products: List[ProductData] = Field(..., min_items=1)
    materials: Optional[List[MaterialData]] = Field(default_factory=list)
    supplier_info: Optional[SupplierInfo] = None
    declared_origin: str = Field(default="European Union (EU)")
    documentation_quality: Optional[float] = Field(0.75, ge=0, le=1)
    assessment_metadata: Optional[Dict] = Field(default_factory=dict)

    @validator('materials', always=True)
    def extract_materials_from_products(cls, v, values):
        """Extract materials from products if not provided separately."""
        if not v and 'products' in values:
            materials = []
            for product in values['products']:
                materials.extend(product.materials)
            return materials
        return v


class CompliancePredictionRequest(BaseModel):
    """Request for compliance probability prediction."""
    product: ProductData
    declared_origin: str = Field(default="European Union (EU)")
    supplier: Optional[SupplierInfo] = None
    trade_agreements: List[str] = Field(
        default_factory=lambda: ["CETA", "EU-UK-TCA"],
        description="Target trade agreements for assessment"
    )


class SupplyChainRiskRequest(BaseModel):
    """Request for supply chain risk analysis."""
    materials: List[MaterialData] = Field(..., min_items=1)
    suppliers: Optional[List[SupplierInfo]] = Field(default_factory=list)
    total_value: Optional[float] = Field(None, gt=0)
    lead_times: Optional[Dict[str, int]] = Field(
        default_factory=dict,
        description="Lead times in days by material or supplier"
    )


# Response Models

class RiskScoreResponse(BaseModel):
    """Response for risk score calculation."""
    score: float = Field(..., ge=0, le=1, description="Risk score (0=low, 1=high)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence in prediction")
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH, CRITICAL")
    factors: Dict[str, float] = Field(..., description="Contributing risk factors")
    explanation: str = Field(..., description="Human-readable explanation")
    recommendations: List[str] = Field(..., description="Risk mitigation recommendations")
    calculated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "score": 0.35,
                "confidence": 0.82,
                "risk_level": "MEDIUM",
                "factors": {
                    "material_count": 12,
                    "eu_content_percentage": 68.5,
                    "complexity_score": 0.48,
                    "supplier_reliability": 0.75,
                    "documentation_quality": 0.80
                },
                "explanation": "Overall risk assessment: MEDIUM (0.35)\n\nKey factors:\n- Good EU content (68.5%) reduces risk\n- Supplier reliability (0.75) is acceptable",
                "recommendations": [
                    "Monitor for any changes in supply chain or regulations"
                ],
                "calculated_at": "2025-10-13T10:30:00Z"
            }
        }


class CompliancePredictionResponse(BaseModel):
    """Response for compliance probability prediction."""
    probability: float = Field(..., ge=0, le=1, description="Compliance probability")
    confidence: float = Field(..., ge=0, le=1, description="Confidence in prediction")
    verdict: str = Field(..., description="LIKELY_COMPLIANT, UNCERTAIN, LIKELY_NON_COMPLIANT")
    compliance_factors: Dict[str, float] = Field(..., description="Factors affecting compliance")
    risk_factors: List[str] = Field(..., description="Identified risk factors")
    explanation: str = Field(..., description="Detailed explanation")
    trade_agreements: List[str] = Field(..., description="Target trade agreements")
    qualified_agreements: List[str] = Field(..., description="Agreements likely qualified for")
    predicted_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "probability": 0.78,
                "confidence": 0.85,
                "verdict": "LIKELY_COMPLIANT",
                "compliance_factors": {
                    "material_count": 8,
                    "eu_content_percentage": 75.0,
                    "eu_value_percentage": 72.5,
                    "complexity_score": 0.32,
                    "supplier_reliability": 0.80
                },
                "risk_factors": [],
                "explanation": "Compliance Prediction: LIKELY_COMPLIANT\nProbability: 78.00%\n\nAnalysis:\n- EU content: 75.0%\n- EU value: 72.5%\n- Material complexity: 8 components",
                "trade_agreements": ["CETA", "EU-UK-TCA"],
                "qualified_agreements": ["CETA", "EU-UK-TCA"],
                "predicted_at": "2025-10-13T10:30:00Z"
            }
        }


class ComponentRisk(BaseModel):
    """Component-level risk information."""
    material: str
    hs_code: str
    origin: str
    risk_score: float
    risk_factors: List[str]


class SupplyChainRiskResponse(BaseModel):
    """Response for supply chain risk analysis."""
    overall_risk_score: float = Field(..., ge=0, le=1, description="Overall risk score")
    confidence: float = Field(..., ge=0, le=1, description="Confidence in analysis")
    risk_breakdown: Dict[str, float] = Field(..., description="Risk by category")
    component_risks: List[ComponentRisk] = Field(..., description="Per-component risk details")
    geographic_risks: Dict[str, float] = Field(..., description="Risk by geography")
    recommendations: List[str] = Field(..., description="Risk mitigation recommendations")
    mitigation_strategies: List[str] = Field(..., description="Mitigation strategies")
    explanation: str = Field(..., description="Overall analysis explanation")
    analyzed_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
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
                "explanation": "Overall Supply Chain Risk: 0.42\n\nRisk Breakdown:\n- Geographic: 0.38\n- Supplier: 0.30",
                "analyzed_at": "2025-10-13T10:30:00Z"
            }
        }


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status: healthy, degraded, unhealthy")
    models_trained: bool = Field(..., description="Whether ML models are trained")
    sklearn_available: bool = Field(..., description="Whether scikit-learn is available")
    model_info: Dict[str, str] = Field(..., description="Model information")
    timestamp: datetime


# API Endpoints

@router.post(
    "/risk-score",
    response_model=RiskScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate risk score for assessment"
)
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Calculate risk score for product assessment.

    Analyzes products, materials, and supplier information to compute
    a comprehensive risk score with explainability.

    **Request Body:**
    - products: List of products to assess
    - materials: Optional list of materials (extracted from products if not provided)
    - supplier_info: Supplier information
    - declared_origin: Declared origin country
    - documentation_quality: Quality score for documentation (0-1)

    **Returns:**
    - Risk score (0-1 scale, where 0=low risk, 1=high risk)
    - Risk level classification
    - Contributing factors
    - Recommendations for risk mitigation
    """
    try:
        service = get_predictive_analytics_service()

        # Convert request to service format
        assessment_data = {
            "products": [p.dict() for p in request.products],
            "materials": [m.dict() for m in request.materials],
            "supplier_info": request.supplier_info.dict() if request.supplier_info else {},
            "declared_origin": request.declared_origin,
            "documentation_quality": request.documentation_quality,
            "assessment_metadata": request.assessment_metadata,
        }

        # Calculate risk score
        risk_score = service.calculate_risk_score(assessment_data)

        # Convert to response format
        return RiskScoreResponse(
            score=risk_score.score,
            confidence=risk_score.confidence,
            risk_level=risk_score.risk_level,
            factors=risk_score.factors,
            explanation=risk_score.explanation,
            recommendations=risk_score.recommendations,
            calculated_at=risk_score.calculated_at,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating risk score: {str(e)}"
        )


@router.post(
    "/compliance-probability",
    response_model=CompliancePredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict compliance probability"
)
async def predict_compliance_probability(request: CompliancePredictionRequest):
    """
    Predict compliance probability for a product.

    Uses ML models to predict the likelihood of compliance with
    trade agreements and origin rules.

    **Request Body:**
    - product: Product information with materials
    - declared_origin: Declared origin country
    - supplier: Supplier information
    - trade_agreements: Target trade agreements (e.g., CETA, EU-UK-TCA)

    **Returns:**
    - Compliance probability (0-1)
    - Verdict classification
    - Risk factors identified
    - Qualified trade agreements
    """
    try:
        service = get_predictive_analytics_service()

        # Convert request to service format
        product_data = {
            **request.product.dict(),
            "declared_origin": request.declared_origin,
            "supplier": request.supplier.dict() if request.supplier else {},
            "trade_agreements": request.trade_agreements,
        }

        # Predict compliance
        prediction = service.predict_compliance_probability(product_data)

        # Convert to response format
        return CompliancePredictionResponse(
            probability=prediction.probability,
            confidence=prediction.confidence,
            verdict=prediction.verdict,
            compliance_factors=prediction.compliance_factors,
            risk_factors=prediction.risk_factors,
            explanation=prediction.explanation,
            trade_agreements=prediction.trade_agreements,
            qualified_agreements=prediction.qualified_agreements,
            predicted_at=prediction.predicted_at,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting compliance: {str(e)}"
        )


@router.post(
    "/supply-chain-risk",
    response_model=SupplyChainRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze supply chain risk"
)
async def analyze_supply_chain_risk(request: SupplyChainRiskRequest):
    """
    Analyze supply chain risk from bill of materials.

    Comprehensive analysis of supply chain risks including:
    - Geographic concentration
    - Supplier reliability
    - Material complexity
    - Component-level risks

    **Request Body:**
    - materials: Bill of materials with origin information
    - suppliers: Supplier information
    - total_value: Total product value
    - lead_times: Lead time data by material/supplier

    **Returns:**
    - Overall risk score
    - Risk breakdown by category
    - Component-level risks
    - Geographic risk distribution
    - Mitigation recommendations
    """
    try:
        service = get_predictive_analytics_service()

        # Convert request to service format
        bom_data = {
            "materials": [m.dict() for m in request.materials],
            "suppliers": [s.dict() for s in request.suppliers] if request.suppliers else [],
            "total_value": request.total_value,
            "lead_times": request.lead_times,
        }

        # Analyze supply chain risk
        report = service.analyze_supply_chain_risk(bom_data)

        # Convert to response format
        component_risks = [
            ComponentRisk(
                material=cr["material"],
                hs_code=cr["hs_code"],
                origin=cr["origin"],
                risk_score=cr["risk_score"],
                risk_factors=cr["risk_factors"]
            )
            for cr in report.component_risks
        ]

        return SupplyChainRiskResponse(
            overall_risk_score=report.overall_risk_score,
            confidence=report.confidence,
            risk_breakdown=report.risk_breakdown,
            component_risks=component_risks,
            geographic_risks=report.geographic_risks,
            recommendations=report.recommendations,
            mitigation_strategies=report.mitigation_strategies,
            explanation=report.explanation,
            analyzed_at=report.analyzed_at,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing supply chain risk: {str(e)}"
        )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check and model status"
)
async def health_check():
    """
    Health check endpoint for predictive analytics service.

    Returns service status and information about ML models.

    **Returns:**
    - Service status
    - Model training status
    - Available features
    """
    try:
        service = get_predictive_analytics_service()

        from backend.services.predictive_analytics_service import SKLEARN_AVAILABLE

        status_value = "healthy" if service.is_trained else "degraded"

        model_info = {
            "risk_model": "DecisionTreeClassifier" if service.risk_model else "Rule-based",
            "compliance_model": "LogisticRegression" if service.compliance_model else "Rule-based",
            "features": "5 features (material_count, eu_content_percentage, complexity_score, supplier_reliability, documentation_quality)",
            "training_data": "45 samples (42 passed, 3 failed)",
        }

        return HealthCheckResponse(
            status=status_value,
            models_trained=service.is_trained,
            sklearn_available=SKLEARN_AVAILABLE,
            model_info=model_info,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}"
        )


# Additional utility endpoint for batch processing

@router.post(
    "/batch-risk-score",
    response_model=List[RiskScoreResponse],
    status_code=status.HTTP_200_OK,
    summary="Calculate risk scores for multiple assessments"
)
async def batch_calculate_risk_score(requests: List[RiskScoreRequest]):
    """
    Calculate risk scores for multiple assessments in batch.

    Useful for processing multiple products or scenarios at once.

    **Request Body:**
    - List of risk score requests

    **Returns:**
    - List of risk score responses (same order as input)
    """
    try:
        service = get_predictive_analytics_service()
        results = []

        for request in requests:
            assessment_data = {
                "products": [p.dict() for p in request.products],
                "materials": [m.dict() for m in request.materials],
                "supplier_info": request.supplier_info.dict() if request.supplier_info else {},
                "declared_origin": request.declared_origin,
                "documentation_quality": request.documentation_quality,
                "assessment_metadata": request.assessment_metadata,
            }

            risk_score = service.calculate_risk_score(assessment_data)

            results.append(RiskScoreResponse(
                score=risk_score.score,
                confidence=risk_score.confidence,
                risk_level=risk_score.risk_level,
                factors=risk_score.factors,
                explanation=risk_score.explanation,
                recommendations=risk_score.recommendations,
                calculated_at=risk_score.calculated_at,
            ))

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in batch risk score calculation: {str(e)}"
        )
