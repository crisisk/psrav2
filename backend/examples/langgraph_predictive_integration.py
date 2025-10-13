"""
LangGraph Integration Example for Predictive Analytics

Demonstrates how to integrate predictive analytics as an optional node
in a LangGraph workflow for origin assessment.
"""

from typing import Dict, List, Optional, TypedDict
from datetime import datetime

# Import predictive analytics service
import sys
sys.path.insert(0, '/home/vncuser/psra-ltsd-enterprise-v2')
from backend.services.predictive_analytics_service import get_predictive_analytics_service


# State definition for LangGraph
class AssessmentState(TypedDict):
    """State for origin assessment workflow."""
    # Input data
    products: List[Dict]
    materials: List[Dict]
    supplier_info: Optional[Dict]
    declared_origin: str

    # Assessment results
    compliance_probability: Optional[float]
    risk_score: Optional[float]
    risk_level: Optional[str]
    verdict: Optional[str]

    # Explanations and recommendations
    risk_explanation: Optional[str]
    recommendations: List[str]
    qualified_agreements: List[str]

    # Metadata
    confidence: float
    requires_manual_review: bool
    timestamp: str


# LangGraph node functions

def predictive_risk_assessment_node(state: AssessmentState) -> AssessmentState:
    """
    LangGraph node for predictive risk assessment.

    This node runs early in the workflow to provide risk indicators
    that can inform subsequent processing steps.
    """
    print("🔮 Running predictive risk assessment...")

    service = get_predictive_analytics_service()

    # Prepare assessment data
    assessment_data = {
        "products": state.get("products", []),
        "materials": state.get("materials", []),
        "supplier_info": state.get("supplier_info", {}),
        "declared_origin": state.get("declared_origin", "Unknown"),
        "documentation_quality": 0.75,  # Could be extracted from state
    }

    try:
        # Calculate risk score
        risk_result = service.calculate_risk_score(assessment_data)

        # Update state
        state["risk_score"] = risk_result.score
        state["risk_level"] = risk_result.risk_level
        state["risk_explanation"] = risk_result.explanation
        state["recommendations"] = risk_result.recommendations
        state["confidence"] = risk_result.confidence

        # Determine if manual review is needed
        state["requires_manual_review"] = (
            risk_result.risk_level in ["HIGH", "CRITICAL"] or
            risk_result.confidence < 0.5
        )

        print(f"  ✓ Risk Score: {risk_result.score:.3f} ({risk_result.risk_level})")
        print(f"  ✓ Confidence: {risk_result.confidence:.3f}")
        print(f"  ✓ Manual Review Required: {state['requires_manual_review']}")

    except Exception as e:
        print(f"  ✗ Error in risk assessment: {e}")
        state["requires_manual_review"] = True

    return state


def predictive_compliance_node(state: AssessmentState) -> AssessmentState:
    """
    LangGraph node for compliance probability prediction.

    This node predicts likelihood of compliance with trade agreements
    before running full rules engine.
    """
    print("🔮 Running compliance prediction...")

    service = get_predictive_analytics_service()

    # Prepare product data
    product_data = {
        "code": state["products"][0].get("code", "UNKNOWN") if state.get("products") else "UNKNOWN",
        "description": state["products"][0].get("description", "") if state.get("products") else "",
        "hs_code": state["products"][0].get("hs_code", "") if state.get("products") else "",
        "materials": state.get("materials", []),
        "supplier": state.get("supplier_info", {}),
        "declared_origin": state.get("declared_origin", "Unknown"),
        "trade_agreements": ["CETA", "EU-UK-TCA", "EU-Japan-EPA"],
    }

    try:
        # Predict compliance
        prediction = service.predict_compliance_probability(product_data)

        # Update state
        state["compliance_probability"] = prediction.probability
        state["verdict"] = prediction.verdict
        state["qualified_agreements"] = prediction.qualified_agreements
        state["confidence"] = min(state.get("confidence", 1.0), prediction.confidence)

        # Update manual review flag
        if prediction.verdict == "LIKELY_NON_COMPLIANT":
            state["requires_manual_review"] = True

        print(f"  ✓ Compliance Probability: {prediction.probability:.1%}")
        print(f"  ✓ Verdict: {prediction.verdict}")
        print(f"  ✓ Qualified Agreements: {', '.join(prediction.qualified_agreements)}")

    except Exception as e:
        print(f"  ✗ Error in compliance prediction: {e}")
        state["requires_manual_review"] = True

    return state


def supply_chain_risk_node(state: AssessmentState) -> AssessmentState:
    """
    LangGraph node for supply chain risk analysis.

    Optional node that provides deeper supply chain insights.
    """
    print("🔮 Running supply chain risk analysis...")

    service = get_predictive_analytics_service()

    # Prepare BOM data
    bom_data = {
        "materials": state.get("materials", []),
        "suppliers": [state.get("supplier_info")] if state.get("supplier_info") else [],
        "total_value": sum(m.get("value", 0) for m in state.get("materials", [])),
    }

    try:
        # Analyze supply chain risk
        report = service.analyze_supply_chain_risk(bom_data)

        # Add supply chain insights to recommendations
        sc_recommendations = [
            f"Supply Chain Risk: {report.overall_risk_score:.2f}",
            f"Geographic Risk: {report.risk_breakdown.get('geographic', 0):.2f}",
        ] + report.recommendations[:2]

        state["recommendations"].extend(sc_recommendations)

        print(f"  ✓ Supply Chain Risk: {report.overall_risk_score:.3f}")
        print(f"  ✓ Risk Categories: {len(report.risk_breakdown)}")

    except Exception as e:
        print(f"  ✗ Error in supply chain analysis: {e}")

    return state


def conditional_routing(state: AssessmentState) -> str:
    """
    Conditional edge function for LangGraph.

    Routes to manual review if risk is high or confidence is low.
    """
    if state.get("requires_manual_review", False):
        return "manual_review"
    elif state.get("risk_level") in ["LOW", "MEDIUM"]:
        return "automated_processing"
    else:
        return "additional_validation"


# Example workflow construction (pseudo-code for LangGraph)
def create_predictive_workflow():
    """
    Create LangGraph workflow with predictive analytics nodes.

    Pseudo-code demonstrating how to structure the workflow:
    """
    workflow_definition = """
    START
      ↓
    [Input Validation]
      ↓
    [Predictive Risk Assessment] ← New predictive node
      ↓
    [Predictive Compliance Check] ← New predictive node
      ↓
    {Conditional Router}
      ├─ High Risk → [Manual Review]
      ├─ Low Risk → [Automated Rules Engine]
      └─ Medium Risk → [Additional Validation] → [Rules Engine]
           ↓
    [Supply Chain Risk Analysis] ← Optional deep dive
      ↓
    [Generate Report]
      ↓
    END

    Key Decision Points:
    - If risk_level = "CRITICAL" or "HIGH" → Manual Review
    - If confidence < 0.5 → Manual Review
    - If compliance_probability < 0.4 → Manual Review
    - Otherwise → Continue automated processing
    """

    return workflow_definition


# Demo execution
def demo_predictive_workflow():
    """Demonstrate predictive analytics workflow with sample data."""
    print("\n" + "="*80)
    print("PREDICTIVE ANALYTICS - LANGGRAPH INTEGRATION DEMO")
    print("="*80 + "\n")

    # Initialize state
    state: AssessmentState = {
        "products": [{
            "code": "AUTO-ECU-001",
            "description": "Automotive Electronic Control Unit",
            "hs_code": "8537109900",
            "materials": []
        }],
        "materials": [
            {"hs_code": "854140", "description": "Semiconductors", "origin_country": "DE", "value": 150, "percentage": 35},
            {"hs_code": "392690", "description": "Plastic housing", "origin_country": "FR", "value": 45, "percentage": 10},
            {"hs_code": "760200", "description": "Aluminum", "origin_country": "IT", "value": 80, "percentage": 19},
        ],
        "supplier_info": {
            "name": "TechComponents GmbH",
            "country": "DE",
            "reliability_score": 0.85
        },
        "declared_origin": "European Union (EU)",
        "compliance_probability": None,
        "risk_score": None,
        "risk_level": None,
        "verdict": None,
        "risk_explanation": None,
        "recommendations": [],
        "qualified_agreements": [],
        "confidence": 1.0,
        "requires_manual_review": False,
        "timestamp": datetime.utcnow().isoformat()
    }

    print("Initial State:")
    print(f"  Product: {state['products'][0]['description']}")
    print(f"  Materials: {len(state['materials'])} components")
    print(f"  Supplier: {state['supplier_info']['name']}")
    print()

    # Execute workflow nodes
    print("WORKFLOW EXECUTION:")
    print("-" * 80)

    state = predictive_risk_assessment_node(state)
    print()

    state = predictive_compliance_node(state)
    print()

    state = supply_chain_risk_node(state)
    print()

    # Determine routing
    print("WORKFLOW ROUTING:")
    print("-" * 80)
    next_step = conditional_routing(state)
    print(f"Next Step: {next_step}")
    print()

    # Final state
    print("FINAL STATE:")
    print("-" * 80)
    print(f"Risk Score: {state.get('risk_score', 0):.3f} ({state.get('risk_level', 'UNKNOWN')})")
    print(f"Compliance Probability: {state.get('compliance_probability', 0):.1%}")
    print(f"Verdict: {state.get('verdict', 'UNKNOWN')}")
    print(f"Confidence: {state.get('confidence', 0):.3f}")
    print(f"Manual Review Required: {state.get('requires_manual_review', False)}")
    print(f"Qualified Agreements: {', '.join(state.get('qualified_agreements', []))}")
    print(f"\nRecommendations ({len(state.get('recommendations', []))}):")
    for i, rec in enumerate(state.get('recommendations', [])[:5], 1):
        print(f"  {i}. {rec}")

    print("\n" + "="*80)
    print("WORKFLOW COMPLETED SUCCESSFULLY")
    print("="*80 + "\n")

    return state


if __name__ == "__main__":
    # Run demo
    final_state = demo_predictive_workflow()

    # Show workflow structure
    print("\nWORKFLOW STRUCTURE:")
    print(create_predictive_workflow())
