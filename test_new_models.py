#!/usr/bin/env python3
"""
Quick validation script for new PSRA domain models.
This script tests the new models without importing the full application.
"""

import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Import models directly
from backend.app.contracts.psra import (
    Agreement,
    AgreementCode,
    AgreementType,
    Assessment,
    AssessmentMetrics,
    AssessmentStatus,
    BillOfMaterials,
    BOMNode,
    ComprehensiveVerdict,
    ConfidenceLevel,
    CountryCode,
    DisqualificationReason,
    Material,
    MaterialType,
    MonetaryValue,
    OriginRule,
    OriginRuleType,
    OriginStatus,
    Product,
    RuleApplication,
    RuleId,
    Severity,
    TradeAgreement,
    VerdictType,
)


def test_material_model():
    """Test Material model with validation."""
    print("Testing Material model...")

    material = Material(
        material_id="MAT-001",
        hs_code="390110",
        description="Polyethylene resin",
        material_type=MaterialType.RAW_MATERIAL,
        percentage=Decimal("45.5"),
        origin_country="CA",
        value=MonetaryValue(amount=1000.00, currency="USD"),
        origin_status=OriginStatus.ORIGINATING,
    )

    assert material.material_id == "MAT-001"
    assert material.percentage == Decimal("45.5")
    assert material.origin_status == OriginStatus.ORIGINATING

    # Test JSON serialization
    json_dict = material.to_json_dict()
    assert "material_id" in json_dict
    assert isinstance(json_dict["percentage"], float)

    print("  ✓ Material model works correctly")


def test_product_model():
    """Test Product model with materials."""
    print("Testing Product model...")

    material1 = Material(
        material_id="MAT-001",
        hs_code="390110",
        description="Polyethylene resin",
        material_type=MaterialType.RAW_MATERIAL,
        percentage=Decimal("50.0"),
        origin_country="CA",
        value=MonetaryValue(amount=1000.00, currency="USD"),
        origin_status=OriginStatus.ORIGINATING,
    )

    material2 = Material(
        material_id="MAT-002",
        hs_code="390120",
        description="Polypropylene",
        material_type=MaterialType.RAW_MATERIAL,
        percentage=Decimal("50.0"),
        origin_country="US",
        value=MonetaryValue(amount=1000.00, currency="USD"),
        origin_status=OriginStatus.NON_ORIGINATING,
    )

    product = Product(
        product_code="PROD-12345",
        description="Automotive plastic component",
        hs_code="870829",
        declared_origin="CA",
        materials=[material1, material2],
        ex_works_price=MonetaryValue(amount=5000.00, currency="USD"),
        production_country="CA",
    )

    assert product.product_code == "PROD-12345"
    assert len(product.materials) == 2
    assert product.total_material_value == Decimal("2000.00")
    assert product.originating_material_percentage == Decimal("50.0")

    print("  ✓ Product model works correctly")


def test_bom_model():
    """Test hierarchical BOM model."""
    print("Testing BOM model...")

    # Create leaf materials
    leaf_material = Material(
        material_id="MAT-LEAF",
        hs_code="390110",
        description="Raw polymer",
        material_type=MaterialType.RAW_MATERIAL,
        percentage=Decimal("100.0"),
        origin_country="CA",
        value=MonetaryValue(amount=500.00, currency="USD"),
        origin_status=OriginStatus.ORIGINATING,
    )

    # Create root material
    root_material = Material(
        material_id="MAT-ROOT",
        hs_code="870829",
        description="Assembly",
        material_type=MaterialType.SUBASSEMBLY,
        percentage=Decimal("100.0"),
        origin_country="CA",
        value=MonetaryValue(amount=2000.00, currency="USD"),
        origin_status=OriginStatus.ORIGINATING,
    )

    # Create BOM tree
    child_node = BOMNode(
        material=leaf_material,
        children=[],
        level=1,
        quantity=Decimal("2.0"),
    )

    root_node = BOMNode(
        material=root_material,
        children=[child_node],
        level=0,
        quantity=Decimal("1.0"),
    )

    bom = BillOfMaterials(
        bom_id="BOM-12345",
        product_code="PROD-12345",
        version="1.0",
        effective_date=date.today(),
        root_nodes=[root_node],
    )

    assert bom.total_material_count == 2
    assert bom.max_depth == 1
    assert len(bom.get_all_materials()) == 2

    print("  ✓ BOM model works correctly")


def test_verdict_and_assessment():
    """Test verdict and assessment models."""
    print("Testing Verdict and Assessment models...")

    # Create rule application
    rule_app = RuleApplication(
        rule_id="CETA-HS39-001",
        rule_title="Polymer origin rule",
        outcome=VerdictType.QUALIFIED,
        confidence=0.85,
        explanation="Product meets RVC threshold of 50%",
        matched_criteria=["regional_value_content"],
        failed_criteria=[],
    )

    assert rule_app.confidence_level == ConfidenceLevel.HIGH

    # Create comprehensive verdict
    verdict = ComprehensiveVerdict(
        verdict=VerdictType.QUALIFIED,
        confidence=0.92,
        explanation="Product qualifies under CETA with 92% confidence",
        rules_applied=[rule_app],
        disqualification_reasons=[],
        recommendations=["Maintain current sourcing patterns"],
        required_actions=[],
    )

    assert verdict.verdict == VerdictType.QUALIFIED
    assert verdict.is_qualified is True
    assert verdict.confidence_level == ConfidenceLevel.VERY_HIGH

    # Create product for assessment
    material = Material(
        material_id="MAT-001",
        hs_code="390110",
        description="Polyethylene resin",
        material_type=MaterialType.RAW_MATERIAL,
        percentage=Decimal("100.0"),
        origin_country="CA",
        value=MonetaryValue(amount=1000.00, currency="USD"),
        origin_status=OriginStatus.ORIGINATING,
    )

    product = Product(
        product_code="PROD-12345",
        description="Automotive plastic component",
        hs_code="870829",
        declared_origin="CA",
        materials=[material],
        ex_works_price=MonetaryValue(amount=5000.00, currency="USD"),
        production_country="CA",
    )

    # Create metrics
    metrics = AssessmentMetrics(
        processing_time_ms=1250.5,
        rules_evaluated=3,
        materials_analyzed=1,
        api_calls_made=5,
        cache_hits=2,
    )

    # Create assessment
    assessment = Assessment(
        assessment_id=uuid4(),
        product=product,
        agreement=Agreement(code="CETA", name="Canada-EU Comprehensive Economic and Trade Agreement"),
        assessed_at=datetime.utcnow(),
        assessed_by="psra-engine-v1",
        status=AssessmentStatus.COMPLETED,
        verdict=verdict,
        metrics=metrics,
    )

    assert assessment.status == AssessmentStatus.COMPLETED
    assert "PROD-12345" in assessment.summary()

    print("  ✓ Verdict and Assessment models work correctly")


def test_trade_agreement_model():
    """Test TradeAgreement and OriginRule models."""
    print("Testing TradeAgreement model...")

    # Create origin rule
    rule = OriginRule(
        rule_id="CETA-HS39-001",
        rule_type=OriginRuleType.REGIONAL_VALUE_CONTENT,
        hs_code="390110",
        description="Polymers must have 50% regional value content",
        conditions=["RVC >= 50%", "Production in party country"],
        rvc_threshold=Decimal("50.0"),
    )

    assert rule.rvc_threshold == Decimal("50.0")

    # Create trade agreement
    agreement = TradeAgreement(
        agreement_code="CETA",
        name="Canada-European Union Comprehensive Economic and Trade Agreement",
        agreement_type=AgreementType.FREE_TRADE_AGREEMENT,
        parties=["CA", "DE", "FR"],
        effective_date=date(2017, 9, 21),
        rules=[rule],
        cumulation_allowed=True,
        de_minimis_threshold=Decimal("10.0"),
    )

    assert agreement.agreement_code == "CETA"
    assert len(agreement.parties) == 3
    assert agreement.is_active()
    assert len(agreement.get_rules_for_hs_code("390110")) == 1

    print("  ✓ TradeAgreement model works correctly")


def test_validation_errors():
    """Test that validation errors are raised correctly."""
    print("Testing validation errors...")

    # Test material percentage over 100% validation
    try:
        material = Material(
            material_id="MAT-001",
            hs_code="390110",
            description="Test",
            material_type=MaterialType.RAW_MATERIAL,
            percentage=Decimal("150.0"),  # Invalid: over 100%
            origin_country="CA",
            value=MonetaryValue(amount=1000.00, currency="USD"),
        )
        assert False, "Should have raised validation error for percentage > 100"
    except Exception as e:
        assert "less than or equal to 100" in str(e).lower()

    # Test NOT_QUALIFIED verdict without disqualification reasons
    try:
        verdict = ComprehensiveVerdict(
            verdict=VerdictType.NOT_QUALIFIED,
            confidence=0.5,
            explanation="Not qualified",
            rules_applied=[],
            disqualification_reasons=[],  # Invalid: must have reasons
        )
        assert False, "Should have raised validation error"
    except Exception as e:
        assert "disqualification" in str(e).lower()

    print("  ✓ Validation errors work correctly")


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("PSRA Domain Models Validation")
    print("=" * 70 + "\n")

    try:
        test_material_model()
        test_product_model()
        test_bom_model()
        test_verdict_and_assessment()
        test_trade_agreement_model()
        test_validation_errors()

        print("\n" + "=" * 70)
        print("✅ All tests passed successfully!")
        print("=" * 70 + "\n")
        return 0

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
