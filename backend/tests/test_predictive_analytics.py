"""
Test Suite for Predictive Analytics Service

Demonstrates functionality with sample data and validates API endpoints.
"""

import json
from datetime import datetime
from typing import Dict, List

# Sample test data based on realistic product assessments


def generate_sample_assessment_data() -> Dict:
    """Generate sample assessment data for risk scoring."""
    return {
        "products": [
            {
                "code": "AUTO-PART-001",
                "description": "Automotive Electronic Control Unit",
                "hs_code": "8537109900",
                "materials": [
                    {
                        "hs_code": "854140",
                        "description": "Semiconductor devices",
                        "origin_country": "DE",
                        "value": 150.0,
                        "percentage": 35.0
                    },
                    {
                        "hs_code": "392690",
                        "description": "Plastic housing",
                        "origin_country": "FR",
                        "value": 45.0,
                        "percentage": 10.5
                    },
                    {
                        "hs_code": "760200",
                        "description": "Aluminum components",
                        "origin_country": "IT",
                        "value": 80.0,
                        "percentage": 18.6
                    },
                    {
                        "hs_code": "854430",
                        "description": "Wiring harness",
                        "origin_country": "PL",
                        "value": 60.0,
                        "percentage": 14.0
                    },
                    {
                        "hs_code": "391910",
                        "description": "Adhesive materials",
                        "origin_country": "NL",
                        "value": 25.0,
                        "percentage": 5.8
                    }
                ],
                "ex_works_value": 430.0
            }
        ],
        "materials": [],  # Will be extracted from products
        "supplier_info": {
            "name": "TechComponents GmbH",
            "country": "DE",
            "reliability_score": 0.85,
            "vat_number": "DE123456789",
            "years_in_business": 15
        },
        "declared_origin": "European Union (EU)",
        "documentation_quality": 0.88,
        "assessment_metadata": {
            "assessment_type": "full",
            "previous_assessments": 3,
            "last_assessment_date": "2025-09-15"
        }
    }


def generate_high_risk_assessment_data() -> Dict:
    """Generate high-risk assessment data for testing."""
    return {
        "products": [
            {
                "code": "COMPLEX-PART-999",
                "description": "Complex Electronic Assembly",
                "hs_code": "8543709099",
                "materials": [
                    {
                        "hs_code": "854140",
                        "description": "Semiconductor devices",
                        "origin_country": "CN",
                        "value": 200.0,
                        "percentage": 40.0
                    },
                    {
                        "hs_code": "854232",
                        "description": "Electronic ICs",
                        "origin_country": "CN",
                        "value": 150.0,
                        "percentage": 30.0
                    },
                    {
                        "hs_code": "392690",
                        "description": "Plastic components",
                        "origin_country": "IN",
                        "value": 50.0,
                        "percentage": 10.0
                    },
                    {
                        "hs_code": "760200",
                        "description": "Metal parts",
                        "origin_country": "TR",
                        "value": 40.0,
                        "percentage": 8.0
                    },
                    {
                        "hs_code": "391910",
                        "description": "Assembly materials",
                        "origin_country": "DE",
                        "value": 30.0,
                        "percentage": 6.0
                    },
                    # Add more materials to increase complexity
                    *[
                        {
                            "hs_code": f"85{i:04d}",
                            "description": f"Component {i}",
                            "origin_country": "CN",
                            "value": 5.0,
                            "percentage": 1.0
                        }
                        for i in range(6, 16)
                    ]
                ],
                "ex_works_value": 500.0
            }
        ],
        "materials": [],
        "supplier_info": {
            "name": "Global Electronics Ltd",
            "country": "CN",
            "reliability_score": 0.55,
            "years_in_business": 5
        },
        "declared_origin": "China",
        "documentation_quality": 0.60,
        "assessment_metadata": {
            "assessment_type": "full",
            "previous_assessments": 0
        }
    }


def generate_compliance_prediction_data() -> Dict:
    """Generate sample compliance prediction data."""
    return {
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
                },
                {
                    "hs_code": "540233",
                    "description": "Polyester thread",
                    "origin_country": "IT",
                    "value": 40.0,
                    "percentage": 20.0
                },
                {
                    "hs_code": "560190",
                    "description": "Padding material",
                    "origin_country": "FR",
                    "value": 30.0,
                    "percentage": 15.0
                },
                {
                    "hs_code": "960622",
                    "description": "Buttons",
                    "origin_country": "PL",
                    "value": 10.0,
                    "percentage": 5.0
                }
            ],
            "ex_works_value": 200.0
        },
        "declared_origin": "European Union (EU)",
        "supplier": {
            "name": "EuroTextiles SA",
            "country": "ES",
            "reliability_score": 0.90,
            "years_in_business": 25
        },
        "trade_agreements": ["CETA", "EU-UK-TCA", "EU-Japan-EPA"]
    }


def generate_supply_chain_risk_data() -> Dict:
    """Generate sample supply chain risk analysis data."""
    return {
        "materials": [
            {
                "hs_code": "721049",
                "description": "Steel sheets",
                "origin_country": "DE",
                "value": 500.0,
                "percentage": 25.0
            },
            {
                "hs_code": "392690",
                "description": "Plastic components",
                "origin_country": "FR",
                "value": 300.0,
                "percentage": 15.0
            },
            {
                "hs_code": "854140",
                "description": "Electronic components",
                "origin_country": "CN",
                "value": 600.0,
                "percentage": 30.0
            },
            {
                "hs_code": "760200",
                "description": "Aluminum parts",
                "origin_country": "IT",
                "value": 250.0,
                "percentage": 12.5
            },
            {
                "hs_code": "391610",
                "description": "Foam materials",
                "origin_country": "PL",
                "value": 150.0,
                "percentage": 7.5
            },
            {
                "hs_code": "732690",
                "description": "Steel fasteners",
                "origin_country": "ES",
                "value": 100.0,
                "percentage": 5.0
            },
            {
                "hs_code": "401693",
                "description": "Rubber seals",
                "origin_country": "NL",
                "value": 100.0,
                "percentage": 5.0
            }
        ],
        "suppliers": [
            {
                "name": "Steel Europa GmbH",
                "country": "DE",
                "reliability_score": 0.92,
                "years_in_business": 30
            },
            {
                "name": "PlastiTech France",
                "country": "FR",
                "reliability_score": 0.88,
                "years_in_business": 20
            },
            {
                "name": "China Electronics Co",
                "country": "CN",
                "reliability_score": 0.70,
                "years_in_business": 10
            }
        ],
        "total_value": 2000.0,
        "lead_times": {
            "steel_sheets": 14,
            "plastic_components": 21,
            "electronic_components": 45,
            "aluminum_parts": 18
        }
    }


def test_risk_score_calculation():
    """Test risk score calculation with sample data."""
    print("\n" + "="*80)
    print("TEST 1: Risk Score Calculation - Normal Risk Product")
    print("="*80)

    from backend.services.predictive_analytics_service import get_predictive_analytics_service

    service = get_predictive_analytics_service()
    assessment_data = generate_sample_assessment_data()

    # Extract materials from products
    assessment_data["materials"] = [
        m for p in assessment_data["products"]
        for m in p.get("materials", [])
    ]

    result = service.calculate_risk_score(assessment_data)

    print(f"\nRisk Score: {result.score:.3f}")
    print(f"Confidence: {result.confidence:.3f}")
    print(f"Risk Level: {result.risk_level}")
    print(f"\nFactors:")
    for factor, value in result.factors.items():
        print(f"  - {factor}: {value:.3f}")
    print(f"\nExplanation:\n{result.explanation}")
    print(f"\nRecommendations:")
    for rec in result.recommendations:
        print(f"  - {rec}")

    print("\n" + "="*80)
    print("TEST 2: Risk Score Calculation - High Risk Product")
    print("="*80)

    high_risk_data = generate_high_risk_assessment_data()
    high_risk_data["materials"] = [
        m for p in high_risk_data["products"]
        for m in p.get("materials", [])
    ]

    result_high = service.calculate_risk_score(high_risk_data)

    print(f"\nRisk Score: {result_high.score:.3f}")
    print(f"Confidence: {result_high.confidence:.3f}")
    print(f"Risk Level: {result_high.risk_level}")
    print(f"\nFactors:")
    for factor, value in result_high.factors.items():
        print(f"  - {factor}: {value:.3f}")
    print(f"\nRecommendations:")
    for rec in result_high.recommendations:
        print(f"  - {rec}")


def test_compliance_prediction():
    """Test compliance probability prediction."""
    print("\n" + "="*80)
    print("TEST 3: Compliance Probability Prediction")
    print("="*80)

    from backend.services.predictive_analytics_service import get_predictive_analytics_service

    service = get_predictive_analytics_service()
    prediction_data = generate_compliance_prediction_data()

    result = service.predict_compliance_probability(prediction_data)

    print(f"\nCompliance Probability: {result.probability:.3f} ({result.probability*100:.1f}%)")
    print(f"Confidence: {result.confidence:.3f}")
    print(f"Verdict: {result.verdict}")
    print(f"\nTrade Agreements: {', '.join(result.trade_agreements)}")
    print(f"Qualified Agreements: {', '.join(result.qualified_agreements)}")
    print(f"\nCompliance Factors:")
    for factor, value in result.compliance_factors.items():
        print(f"  - {factor}: {value:.3f}")

    if result.risk_factors:
        print(f"\nRisk Factors:")
        for factor in result.risk_factors:
            print(f"  - {factor}")

    print(f"\nExplanation:\n{result.explanation}")


def test_supply_chain_risk():
    """Test supply chain risk analysis."""
    print("\n" + "="*80)
    print("TEST 4: Supply Chain Risk Analysis")
    print("="*80)

    from backend.services.predictive_analytics_service import get_predictive_analytics_service

    service = get_predictive_analytics_service()
    risk_data = generate_supply_chain_risk_data()

    result = service.analyze_supply_chain_risk(risk_data)

    print(f"\nOverall Risk Score: {result.overall_risk_score:.3f}")
    print(f"Confidence: {result.confidence:.3f}")
    print(f"\nRisk Breakdown:")
    for category, score in result.risk_breakdown.items():
        print(f"  - {category.title()}: {score:.3f}")

    print(f"\nGeographic Risks:")
    for country, risk in sorted(result.geographic_risks.items()):
        if country != "overall":
            print(f"  - {country}: {risk:.3f}")

    print(f"\nTop Component Risks:")
    for i, component in enumerate(result.component_risks[:5], 1):
        print(f"  {i}. {component['material']} ({component['origin']}) - Risk: {component['risk_score']:.3f}")

    print(f"\nRecommendations:")
    for rec in result.recommendations:
        print(f"  - {rec}")

    print(f"\nMitigation Strategies:")
    for strategy in result.mitigation_strategies:
        print(f"  - {strategy}")


def test_api_request_format():
    """Generate sample API request JSON for documentation."""
    print("\n" + "="*80)
    print("TEST 5: Sample API Request Formats")
    print("="*80)

    # Risk Score API Request
    risk_request = {
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
                ],
                "ex_works_value": 430.0
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

    print("\nPOST /api/predictive/risk-score")
    print("Request Body:")
    print(json.dumps(risk_request, indent=2))

    # Compliance Prediction API Request
    compliance_request = {
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

    print("\nPOST /api/predictive/compliance-probability")
    print("Request Body:")
    print(json.dumps(compliance_request, indent=2))


def run_all_tests():
    """Run all predictive analytics tests."""
    print("\n")
    print("#" * 80)
    print("# PREDICTIVE ANALYTICS SERVICE - TEST SUITE")
    print("#" * 80)

    try:
        test_risk_score_calculation()
        test_compliance_prediction()
        test_supply_chain_risk()
        test_api_request_format()

        print("\n" + "="*80)
        print("ALL TESTS COMPLETED SUCCESSFULLY")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n\nERROR: Test failed with exception: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_tests()
