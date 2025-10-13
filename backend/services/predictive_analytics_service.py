"""
Predictive Analytics Service for Risk Scoring and Compliance Prediction

This service provides ML-based predictive capabilities:
- Risk score calculation for product assessments
- Compliance probability prediction
- Supply chain risk analysis
- Feature extraction and model training

Features:
- Scikit-learn based ML models (Decision Tree, Logistic Regression)
- Confidence thresholds and explainability
- Historical data analysis
- Mock training data based on CFO dashboard metrics
"""

from __future__ import annotations

import logging as log_module
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass, field

# ML imports
try:
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    log_module.warning("scikit-learn not available. Predictive analytics will use fallback logic.")


logger = log_module.getLogger(__name__)


# Data Models
@dataclass
class RiskScore:
    """Risk score result with explanation."""
    score: float  # 0.0 (low risk) to 1.0 (high risk)
    confidence: float  # 0.0 to 1.0
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    factors: Dict[str, float]  # Contributing factors
    explanation: str
    recommendations: List[str] = field(default_factory=list)
    calculated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class CompliancePrediction:
    """Compliance probability prediction."""
    probability: float  # 0.0 to 1.0
    confidence: float
    verdict: str  # "LIKELY_COMPLIANT", "UNCERTAIN", "LIKELY_NON_COMPLIANT"
    compliance_factors: Dict[str, float]
    risk_factors: List[str]
    explanation: str
    trade_agreements: List[str] = field(default_factory=list)
    qualified_agreements: List[str] = field(default_factory=list)
    predicted_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SupplyChainRiskReport:
    """Supply chain risk analysis report."""
    overall_risk_score: float
    confidence: float
    risk_breakdown: Dict[str, float]  # By category
    component_risks: List[Dict[str, any]]
    geographic_risks: Dict[str, float]  # By country/region
    recommendations: List[str]
    mitigation_strategies: List[str]
    explanation: str
    analyzed_at: datetime = field(default_factory=datetime.utcnow)


class PredictiveAnalyticsService:
    """
    Service for predictive analytics and risk scoring.

    Uses machine learning models to:
    1. Calculate risk scores from assessment data
    2. Predict compliance probability
    3. Analyze supply chain risks
    """

    def __init__(self):
        """Initialize predictive analytics service."""
        self.risk_model = None
        self.compliance_model = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.is_trained = False

        # Confidence thresholds
        self.HIGH_CONFIDENCE_THRESHOLD = 0.75
        self.MEDIUM_CONFIDENCE_THRESHOLD = 0.50

        # Risk thresholds
        self.CRITICAL_RISK_THRESHOLD = 0.80
        self.HIGH_RISK_THRESHOLD = 0.60
        self.MEDIUM_RISK_THRESHOLD = 0.40

        # Initialize with mock training data
        self._initialize_models()

        logger.info("Predictive Analytics Service initialized")

    def _initialize_models(self):
        """Initialize and train models with mock historical data."""
        if not SKLEARN_AVAILABLE:
            logger.warning("Scikit-learn not available. Using rule-based fallback.")
            return

        try:
            # Generate mock training data based on CFO dashboard (42 passed, 3 failed)
            X_train, y_risk, y_compliance = self._generate_mock_training_data()

            # Train risk scoring model (Decision Tree)
            self.risk_model = DecisionTreeClassifier(
                max_depth=5,
                min_samples_split=5,
                random_state=42
            )
            self.risk_model.fit(X_train, y_risk)

            # Train compliance prediction model (Logistic Regression)
            self.compliance_model = LogisticRegression(
                random_state=42,
                max_iter=1000
            )
            self.compliance_model.fit(X_train, y_compliance)

            # Fit scaler
            self.scaler.fit(X_train)

            self.is_trained = True
            logger.info("ML models trained successfully with mock data")

        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            self.is_trained = False

    def _generate_mock_training_data(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generate mock training data based on CFO dashboard statistics.

        Simulates 45 historical assessments (42 passed, 3 failed).
        Features: material_count, eu_content_percentage, complexity_score,
                  supplier_reliability, documentation_quality

        Returns:
            Tuple of (features, risk_labels, compliance_labels)
        """
        np.random.seed(42)

        # 42 successful assessments (compliant, low risk)
        successful_assessments = []
        for _ in range(42):
            assessment = [
                np.random.randint(3, 15),      # material_count
                np.random.uniform(65, 95),     # eu_content_percentage
                np.random.uniform(0.2, 0.6),   # complexity_score
                np.random.uniform(0.7, 1.0),   # supplier_reliability
                np.random.uniform(0.7, 1.0),   # documentation_quality
            ]
            successful_assessments.append(assessment)

        # 3 failed assessments (non-compliant, high risk)
        failed_assessments = []
        for _ in range(3):
            assessment = [
                np.random.randint(15, 25),     # material_count (high complexity)
                np.random.uniform(20, 45),     # eu_content_percentage (low EU content)
                np.random.uniform(0.7, 0.95),  # complexity_score (high)
                np.random.uniform(0.2, 0.5),   # supplier_reliability (low)
                np.random.uniform(0.3, 0.6),   # documentation_quality (poor)
            ]
            failed_assessments.append(assessment)

        # Combine data
        X = np.array(successful_assessments + failed_assessments)

        # Risk labels: 0 = low risk, 1 = high risk
        y_risk = np.array([0] * 42 + [1] * 3)

        # Compliance labels: 1 = compliant, 0 = non-compliant
        y_compliance = np.array([1] * 42 + [0] * 3)

        return X, y_risk, y_compliance

    def calculate_risk_score(self, assessment_data: Dict) -> RiskScore:
        """
        Calculate risk score for an assessment.

        Args:
            assessment_data: Dictionary containing:
                - products: List of product data
                - materials: List of material/component data
                - supplier_info: Supplier information
                - declared_origin: Declared origin country
                - assessment_metadata: Additional metadata

        Returns:
            RiskScore object with score, confidence, and explanation
        """
        try:
            # Extract features
            features = self._extract_risk_features(assessment_data)

            if SKLEARN_AVAILABLE and self.is_trained and self.risk_model:
                # Use ML model
                risk_score = self._predict_risk_with_ml(features)
            else:
                # Use rule-based fallback
                risk_score = self._predict_risk_with_rules(features)

            return risk_score

        except Exception as e:
            logger.error(f"Error calculating risk score: {e}")
            return RiskScore(
                score=0.5,
                confidence=0.3,
                risk_level="MEDIUM",
                factors={"error": 1.0},
                explanation=f"Error in risk calculation: {str(e)}",
                recommendations=["Manual review required"]
            )

    def predict_compliance_probability(self, product_data: Dict) -> CompliancePrediction:
        """
        Predict compliance probability for a product.

        Args:
            product_data: Dictionary containing:
                - hs_code: Harmonized System code
                - materials: Bill of materials
                - declared_origin: Declared origin
                - supplier: Supplier information
                - trade_agreements: Target trade agreements

        Returns:
            CompliancePrediction with probability and explanation
        """
        try:
            # Extract features
            features = self._extract_compliance_features(product_data)

            if SKLEARN_AVAILABLE and self.is_trained and self.compliance_model:
                # Use ML model
                prediction = self._predict_compliance_with_ml(features, product_data)
            else:
                # Use rule-based fallback
                prediction = self._predict_compliance_with_rules(features, product_data)

            return prediction

        except Exception as e:
            logger.error(f"Error predicting compliance: {e}")
            return CompliancePrediction(
                probability=0.5,
                confidence=0.3,
                verdict="UNCERTAIN",
                compliance_factors={"error": 0.5},
                risk_factors=["Prediction error occurred"],
                explanation=f"Error in compliance prediction: {str(e)}",
                trade_agreements=product_data.get("trade_agreements", [])
            )

    def analyze_supply_chain_risk(self, bom_data: Dict) -> SupplyChainRiskReport:
        """
        Analyze supply chain risk from bill of materials.

        Args:
            bom_data: Dictionary containing:
                - materials: List of materials with origin countries
                - suppliers: Supplier information
                - total_value: Total product value
                - lead_times: Lead time data

        Returns:
            SupplyChainRiskReport with comprehensive risk analysis
        """
        try:
            # Extract materials and analyze
            materials = bom_data.get("materials", [])
            suppliers = bom_data.get("suppliers", [])

            # Calculate risk components
            geographic_risks = self._analyze_geographic_risk(materials)
            supplier_risks = self._analyze_supplier_risk(suppliers)
            concentration_risk = self._analyze_concentration_risk(materials)
            complexity_risk = self._analyze_complexity_risk(materials)

            # Aggregate overall risk
            risk_breakdown = {
                "geographic": geographic_risks.get("overall", 0.3),
                "supplier": supplier_risks,
                "concentration": concentration_risk,
                "complexity": complexity_risk,
            }

            overall_risk = np.mean(list(risk_breakdown.values()))

            # Determine confidence based on data completeness
            data_completeness = self._assess_data_completeness(bom_data)
            confidence = data_completeness

            # Generate recommendations
            recommendations = self._generate_risk_recommendations(
                risk_breakdown,
                geographic_risks
            )

            # Generate mitigation strategies
            mitigation_strategies = self._generate_mitigation_strategies(
                overall_risk,
                risk_breakdown
            )

            # Build explanation
            explanation = self._build_supply_chain_explanation(
                overall_risk,
                risk_breakdown,
                materials
            )

            # Analyze component-level risks
            component_risks = [
                {
                    "material": mat.get("description", "Unknown"),
                    "hs_code": mat.get("hs_code", ""),
                    "origin": mat.get("origin_country", "Unknown"),
                    "risk_score": self._calculate_component_risk(mat),
                    "risk_factors": self._identify_component_risk_factors(mat),
                }
                for mat in materials[:10]  # Limit to top 10 for performance
            ]

            return SupplyChainRiskReport(
                overall_risk_score=overall_risk,
                confidence=confidence,
                risk_breakdown=risk_breakdown,
                component_risks=component_risks,
                geographic_risks=geographic_risks,
                recommendations=recommendations,
                mitigation_strategies=mitigation_strategies,
                explanation=explanation
            )

        except Exception as e:
            logger.error(f"Error analyzing supply chain risk: {e}")
            return SupplyChainRiskReport(
                overall_risk_score=0.5,
                confidence=0.3,
                risk_breakdown={"error": 0.5},
                component_risks=[],
                geographic_risks={},
                recommendations=["Manual supply chain review required"],
                mitigation_strategies=["Conduct detailed risk assessment"],
                explanation=f"Error in supply chain analysis: {str(e)}"
            )

    # Feature extraction methods

    def _extract_risk_features(self, assessment_data: Dict) -> Dict[str, float]:
        """Extract features for risk scoring."""
        products = assessment_data.get("products", [])
        materials = assessment_data.get("materials", [])
        supplier_info = assessment_data.get("supplier_info", {})

        # Count materials
        material_count = len(materials) if materials else len(
            [m for p in products for m in p.get("materials", [])]
        )

        # Calculate EU content percentage
        eu_countries = {"DE", "FR", "IT", "ES", "NL", "BE", "AT", "PL", "SE", "DK"}
        eu_materials = sum(
            1 for m in materials
            if m.get("origin_country", "") in eu_countries
        )
        eu_content_percentage = (eu_materials / material_count * 100) if material_count > 0 else 50

        # Complexity score (normalized)
        complexity_score = min(material_count / 20, 1.0)

        # Supplier reliability (from metadata or default)
        supplier_reliability = supplier_info.get("reliability_score", 0.7)

        # Documentation quality
        documentation_quality = assessment_data.get("documentation_quality", 0.75)

        return {
            "material_count": material_count,
            "eu_content_percentage": eu_content_percentage,
            "complexity_score": complexity_score,
            "supplier_reliability": supplier_reliability,
            "documentation_quality": documentation_quality,
        }

    def _extract_compliance_features(self, product_data: Dict) -> Dict[str, float]:
        """Extract features for compliance prediction."""
        materials = product_data.get("materials", [])

        # Similar features to risk scoring
        material_count = len(materials)

        eu_countries = {"DE", "FR", "IT", "ES", "NL", "BE", "AT", "PL", "SE", "DK"}
        eu_materials = sum(
            1 for m in materials
            if m.get("origin_country", "") in eu_countries
        )
        eu_content_percentage = (eu_materials / material_count * 100) if material_count > 0 else 50

        # Calculate value percentages
        total_value = sum(m.get("value", 0) for m in materials)
        eu_value = sum(
            m.get("value", 0) for m in materials
            if m.get("origin_country", "") in eu_countries
        )
        eu_value_percentage = (eu_value / total_value * 100) if total_value > 0 else 50

        complexity_score = min(material_count / 20, 1.0)
        supplier_reliability = product_data.get("supplier", {}).get("reliability_score", 0.7)

        return {
            "material_count": material_count,
            "eu_content_percentage": eu_content_percentage,
            "eu_value_percentage": eu_value_percentage,
            "complexity_score": complexity_score,
            "supplier_reliability": supplier_reliability,
        }

    # ML prediction methods

    def _predict_risk_with_ml(self, features: Dict[str, float]) -> RiskScore:
        """Predict risk using ML model."""
        # Convert features to array
        feature_array = np.array([[
            features["material_count"],
            features["eu_content_percentage"],
            features["complexity_score"],
            features["supplier_reliability"],
            features["documentation_quality"],
        ]])

        # Predict
        risk_class = self.risk_model.predict(feature_array)[0]
        risk_proba = self.risk_model.predict_proba(feature_array)[0]

        # Calculate risk score (0-1 scale)
        risk_score = risk_proba[1] if len(risk_proba) > 1 else float(risk_class)

        # Determine confidence (based on prediction probability margin)
        confidence = max(risk_proba) if len(risk_proba) > 1 else 0.7

        # Determine risk level
        if risk_score >= self.CRITICAL_RISK_THRESHOLD:
            risk_level = "CRITICAL"
        elif risk_score >= self.HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
        elif risk_score >= self.MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Build explanation
        explanation = self._build_risk_explanation(risk_score, risk_level, features)

        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, features)

        return RiskScore(
            score=risk_score,
            confidence=confidence,
            risk_level=risk_level,
            factors=features,
            explanation=explanation,
            recommendations=recommendations
        )

    def _predict_risk_with_rules(self, features: Dict[str, float]) -> RiskScore:
        """Fallback rule-based risk prediction."""
        # Calculate weighted risk score
        weights = {
            "material_count": 0.2,
            "eu_content_percentage": 0.3,
            "complexity_score": 0.2,
            "supplier_reliability": 0.15,
            "documentation_quality": 0.15,
        }

        # Normalize features to 0-1 risk scale
        risk_contributions = {
            "material_count": min(features["material_count"] / 25, 1.0) * weights["material_count"],
            "eu_content_percentage": (1 - features["eu_content_percentage"] / 100) * weights["eu_content_percentage"],
            "complexity_score": features["complexity_score"] * weights["complexity_score"],
            "supplier_reliability": (1 - features["supplier_reliability"]) * weights["supplier_reliability"],
            "documentation_quality": (1 - features["documentation_quality"]) * weights["documentation_quality"],
        }

        risk_score = sum(risk_contributions.values())

        # Determine risk level
        if risk_score >= self.CRITICAL_RISK_THRESHOLD:
            risk_level = "CRITICAL"
        elif risk_score >= self.HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
        elif risk_score >= self.MEDIUM_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        explanation = self._build_risk_explanation(risk_score, risk_level, features)
        recommendations = self._generate_recommendations(risk_level, features)

        return RiskScore(
            score=risk_score,
            confidence=0.65,  # Lower confidence for rule-based
            risk_level=risk_level,
            factors=risk_contributions,
            explanation=explanation,
            recommendations=recommendations
        )

    def _predict_compliance_with_ml(
        self,
        features: Dict[str, float],
        product_data: Dict
    ) -> CompliancePrediction:
        """Predict compliance using ML model."""
        # Convert features to array
        feature_array = np.array([[
            features["material_count"],
            features["eu_content_percentage"],
            features["complexity_score"],
            features["supplier_reliability"],
            features.get("eu_value_percentage", features["eu_content_percentage"]),
        ]])

        # Predict
        compliance_proba = self.compliance_model.predict_proba(feature_array)[0]
        probability = compliance_proba[1] if len(compliance_proba) > 1 else 0.5

        # Determine confidence
        confidence = max(compliance_proba) if len(compliance_proba) > 1 else 0.7

        # Determine verdict
        if probability >= 0.70:
            verdict = "LIKELY_COMPLIANT"
        elif probability >= 0.40:
            verdict = "UNCERTAIN"
        else:
            verdict = "LIKELY_NON_COMPLIANT"

        # Identify risk factors
        risk_factors = self._identify_risk_factors(features, probability)

        # Determine qualified agreements
        trade_agreements = product_data.get("trade_agreements", ["CETA", "EU-UK-TCA"])
        qualified_agreements = trade_agreements if probability >= 0.60 else []

        explanation = self._build_compliance_explanation(
            probability,
            verdict,
            features,
            risk_factors
        )

        return CompliancePrediction(
            probability=probability,
            confidence=confidence,
            verdict=verdict,
            compliance_factors=features,
            risk_factors=risk_factors,
            explanation=explanation,
            trade_agreements=trade_agreements,
            qualified_agreements=qualified_agreements
        )

    def _predict_compliance_with_rules(
        self,
        features: Dict[str, float],
        product_data: Dict
    ) -> CompliancePrediction:
        """Fallback rule-based compliance prediction."""
        # Calculate compliance probability
        eu_content = features["eu_content_percentage"] / 100
        eu_value = features.get("eu_value_percentage", features["eu_content_percentage"]) / 100
        supplier_rel = features["supplier_reliability"]
        complexity_penalty = features["complexity_score"] * 0.2

        probability = (
            eu_content * 0.3 +
            eu_value * 0.4 +
            supplier_rel * 0.3 -
            complexity_penalty
        )
        probability = max(0, min(1, probability))

        # Determine verdict
        if probability >= 0.70:
            verdict = "LIKELY_COMPLIANT"
        elif probability >= 0.40:
            verdict = "UNCERTAIN"
        else:
            verdict = "LIKELY_NON_COMPLIANT"

        risk_factors = self._identify_risk_factors(features, probability)

        trade_agreements = product_data.get("trade_agreements", ["CETA", "EU-UK-TCA"])
        qualified_agreements = trade_agreements if probability >= 0.60 else []

        explanation = self._build_compliance_explanation(
            probability,
            verdict,
            features,
            risk_factors
        )

        return CompliancePrediction(
            probability=probability,
            confidence=0.60,
            verdict=verdict,
            compliance_factors=features,
            risk_factors=risk_factors,
            explanation=explanation,
            trade_agreements=trade_agreements,
            qualified_agreements=qualified_agreements
        )

    # Supply chain analysis methods

    def _analyze_geographic_risk(self, materials: List[Dict]) -> Dict[str, float]:
        """Analyze geographic risk from material origins."""
        country_risk_scores = {
            # Low risk EU countries
            "DE": 0.1, "FR": 0.1, "IT": 0.15, "ES": 0.15, "NL": 0.1,
            "BE": 0.1, "AT": 0.1, "PL": 0.2, "SE": 0.1, "DK": 0.1,
            # Medium risk
            "GB": 0.25, "US": 0.3, "CA": 0.25, "JP": 0.25, "KR": 0.3,
            # Higher risk
            "CN": 0.5, "IN": 0.4, "TR": 0.45, "RU": 0.7,
        }

        country_counts = {}
        for material in materials:
            country = material.get("origin_country", "XX")
            country_counts[country] = country_counts.get(country, 0) + 1

        geographic_risks = {}
        total_materials = len(materials) if materials else 1

        for country, count in country_counts.items():
            risk = country_risk_scores.get(country, 0.5)
            weight = count / total_materials
            geographic_risks[country] = risk * weight

        overall = sum(geographic_risks.values()) if geographic_risks else 0.3
        geographic_risks["overall"] = overall

        return geographic_risks

    def _analyze_supplier_risk(self, suppliers: List[Dict]) -> float:
        """Analyze supplier-related risk."""
        if not suppliers:
            return 0.4  # Medium risk if no supplier data

        # Average supplier reliability
        reliability_scores = [
            s.get("reliability_score", 0.5) for s in suppliers
        ]
        avg_reliability = np.mean(reliability_scores)

        # Convert to risk (inverse of reliability)
        return 1 - avg_reliability

    def _analyze_concentration_risk(self, materials: List[Dict]) -> float:
        """Analyze supply concentration risk."""
        if not materials:
            return 0.3

        # Check if too many materials from single country
        country_counts = {}
        for material in materials:
            country = material.get("origin_country", "XX")
            country_counts[country] = country_counts.get(country, 0) + 1

        if country_counts:
            max_concentration = max(country_counts.values()) / len(materials)
            # High concentration = high risk
            return max_concentration * 0.7

        return 0.3

    def _analyze_complexity_risk(self, materials: List[Dict]) -> float:
        """Analyze complexity-related risk."""
        material_count = len(materials) if materials else 0

        # More materials = higher complexity = higher risk
        if material_count > 20:
            return 0.8
        elif material_count > 15:
            return 0.6
        elif material_count > 10:
            return 0.4
        else:
            return 0.2

    def _assess_data_completeness(self, bom_data: Dict) -> float:
        """Assess completeness of BOM data for confidence calculation."""
        completeness_score = 0.0
        checks = 0

        # Check materials present
        if bom_data.get("materials"):
            completeness_score += 0.4
        checks += 1

        # Check suppliers present
        if bom_data.get("suppliers"):
            completeness_score += 0.3
        checks += 1

        # Check value data present
        if bom_data.get("total_value"):
            completeness_score += 0.2
        checks += 1

        # Check lead time data
        if bom_data.get("lead_times"):
            completeness_score += 0.1
        checks += 1

        return completeness_score

    def _calculate_component_risk(self, material: Dict) -> float:
        """Calculate risk score for individual component."""
        country_risk_scores = {
            "DE": 0.1, "FR": 0.1, "IT": 0.15, "ES": 0.15, "NL": 0.1,
            "GB": 0.25, "US": 0.3, "CN": 0.5, "RU": 0.7,
        }

        country = material.get("origin_country", "XX")
        base_risk = country_risk_scores.get(country, 0.5)

        # Adjust for value percentage if available
        value_pct = material.get("percentage", 50) / 100
        weighted_risk = base_risk * (0.5 + value_pct * 0.5)

        return weighted_risk

    def _identify_component_risk_factors(self, material: Dict) -> List[str]:
        """Identify risk factors for component."""
        risk_factors = []

        high_risk_countries = {"CN", "RU", "IN", "TR"}
        country = material.get("origin_country", "")

        if country in high_risk_countries:
            risk_factors.append(f"High-risk origin country: {country}")

        if material.get("percentage", 0) > 30:
            risk_factors.append("High value percentage in BOM")

        if not material.get("description"):
            risk_factors.append("Incomplete material documentation")

        return risk_factors

    # Explanation and recommendation methods

    def _build_risk_explanation(
        self,
        risk_score: float,
        risk_level: str,
        features: Dict[str, float]
    ) -> str:
        """Build human-readable risk explanation."""
        explanation_parts = [
            f"Overall risk assessment: {risk_level} ({risk_score:.2f})",
            "",
            "Key factors:",
        ]

        if features["eu_content_percentage"] < 50:
            explanation_parts.append(
                f"- Low EU content ({features['eu_content_percentage']:.1f}%) increases risk"
            )
        else:
            explanation_parts.append(
                f"- Good EU content ({features['eu_content_percentage']:.1f}%) reduces risk"
            )

        if features["material_count"] > 15:
            explanation_parts.append(
                f"- High material count ({features['material_count']}) adds complexity"
            )

        if features["supplier_reliability"] < 0.6:
            explanation_parts.append(
                f"- Lower supplier reliability ({features['supplier_reliability']:.2f}) increases risk"
            )

        if features["documentation_quality"] < 0.7:
            explanation_parts.append(
                f"- Documentation quality ({features['documentation_quality']:.2f}) needs improvement"
            )

        return "\n".join(explanation_parts)

    def _generate_recommendations(
        self,
        risk_level: str,
        features: Dict[str, float]
    ) -> List[str]:
        """Generate risk mitigation recommendations."""
        recommendations = []

        if risk_level in ["HIGH", "CRITICAL"]:
            recommendations.append("Conduct detailed manual review before proceeding")

        if features["eu_content_percentage"] < 50:
            recommendations.append(
                "Consider sourcing more materials from EU to improve origin compliance"
            )

        if features["material_count"] > 15:
            recommendations.append(
                "Review BOM to simplify supply chain where possible"
            )

        if features["supplier_reliability"] < 0.6:
            recommendations.append(
                "Verify supplier credentials and compliance history"
            )

        if features["documentation_quality"] < 0.7:
            recommendations.append(
                "Request additional documentation to support origin claims"
            )

        if not recommendations:
            recommendations.append("Monitor for any changes in supply chain or regulations")

        return recommendations

    def _identify_risk_factors(
        self,
        features: Dict[str, float],
        probability: float
    ) -> List[str]:
        """Identify specific risk factors affecting compliance."""
        risk_factors = []

        if features["eu_content_percentage"] < 40:
            risk_factors.append("Low EU content percentage")

        if features.get("eu_value_percentage", 50) < 40:
            risk_factors.append("Low EU value content")

        if features["material_count"] > 20:
            risk_factors.append("High BOM complexity")

        if features["supplier_reliability"] < 0.5:
            risk_factors.append("Supplier reliability concerns")

        if probability < 0.4:
            risk_factors.append("Insufficient evidence for preferential origin")

        return risk_factors

    def _build_compliance_explanation(
        self,
        probability: float,
        verdict: str,
        features: Dict[str, float],
        risk_factors: List[str]
    ) -> str:
        """Build compliance prediction explanation."""
        explanation_parts = [
            f"Compliance Prediction: {verdict}",
            f"Probability: {probability:.2%}",
            "",
            "Analysis:",
        ]

        explanation_parts.append(
            f"- EU content: {features['eu_content_percentage']:.1f}%"
        )

        if "eu_value_percentage" in features:
            explanation_parts.append(
                f"- EU value: {features['eu_value_percentage']:.1f}%"
            )

        explanation_parts.append(
            f"- Material complexity: {features['material_count']} components"
        )

        if risk_factors:
            explanation_parts.append("")
            explanation_parts.append("Risk factors identified:")
            for factor in risk_factors:
                explanation_parts.append(f"- {factor}")

        return "\n".join(explanation_parts)

    def _build_supply_chain_explanation(
        self,
        overall_risk: float,
        risk_breakdown: Dict[str, float],
        materials: List[Dict]
    ) -> str:
        """Build supply chain risk explanation."""
        explanation_parts = [
            f"Overall Supply Chain Risk: {overall_risk:.2f}",
            "",
            "Risk Breakdown:",
        ]

        for category, score in risk_breakdown.items():
            explanation_parts.append(f"- {category.title()}: {score:.2f}")

        explanation_parts.append("")
        explanation_parts.append(
            f"Analyzed {len(materials)} components across the supply chain."
        )

        return "\n".join(explanation_parts)

    def _generate_risk_recommendations(
        self,
        risk_breakdown: Dict[str, float],
        geographic_risks: Dict[str, float]
    ) -> List[str]:
        """Generate supply chain risk recommendations."""
        recommendations = []

        if risk_breakdown.get("geographic", 0) > 0.5:
            recommendations.append(
                "Diversify geographic sourcing to reduce country concentration risk"
            )

        if risk_breakdown.get("supplier", 0) > 0.5:
            recommendations.append(
                "Conduct supplier audits and implement supplier quality management"
            )

        if risk_breakdown.get("concentration", 0) > 0.6:
            recommendations.append(
                "Develop alternative suppliers to reduce single-source dependencies"
            )

        if risk_breakdown.get("complexity", 0) > 0.6:
            recommendations.append(
                "Simplify BOM and consolidate suppliers where feasible"
            )

        # Check for high-risk countries
        high_risk_countries = [
            country for country, risk in geographic_risks.items()
            if country != "overall" and risk > 0.5
        ]
        if high_risk_countries:
            recommendations.append(
                f"Review sourcing from high-risk countries: {', '.join(high_risk_countries)}"
            )

        if not recommendations:
            recommendations.append(
                "Continue monitoring supply chain for emerging risks"
            )

        return recommendations

    def _generate_mitigation_strategies(
        self,
        overall_risk: float,
        risk_breakdown: Dict[str, float]
    ) -> List[str]:
        """Generate mitigation strategies based on risk level."""
        strategies = []

        if overall_risk > 0.7:
            strategies.append(
                "Implement immediate risk mitigation: Dual sourcing for critical components"
            )
            strategies.append(
                "Establish contingency inventory for high-risk materials"
            )
        elif overall_risk > 0.5:
            strategies.append(
                "Develop 6-month risk mitigation roadmap"
            )
            strategies.append(
                "Increase monitoring frequency for at-risk suppliers"
            )
        else:
            strategies.append(
                "Maintain current supplier relationships with regular reviews"
            )

        strategies.append(
            "Document and maintain updated BOM with origin information"
        )
        strategies.append(
            "Conduct quarterly supply chain risk assessments"
        )

        return strategies


# Singleton instance
_predictive_analytics_service: Optional[PredictiveAnalyticsService] = None


def get_predictive_analytics_service() -> PredictiveAnalyticsService:
    """Get or create predictive analytics service instance."""
    global _predictive_analytics_service

    if _predictive_analytics_service is None:
        _predictive_analytics_service = PredictiveAnalyticsService()

    return _predictive_analytics_service
