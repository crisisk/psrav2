# PSRA Models Quick Reference

## File Location
`/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py`

## New Models Added

### Core Domain Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Material` | Raw materials/components | material_id, hs_code, percentage, origin_country, value, origin_status |
| `Product` | Finished goods | product_code, hs_code, materials, ex_works_price, production_country |
| `BOMNode` | BOM tree node | material, children, level, quantity |
| `BillOfMaterials` | Hierarchical BOM | bom_id, product_code, version, root_nodes |

### Assessment Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Assessment` | Top-level assessment | assessment_id, product, agreement, verdict, metrics |
| `ComprehensiveVerdict` | Detailed verdict | verdict, confidence, explanation, rules_applied |
| `RuleApplication` | Rule application record | rule_id, outcome, confidence, explanation |
| `AssessmentMetrics` | Performance metrics | processing_time_ms, rules_evaluated, materials_analyzed |

### Trade Agreement Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `TradeAgreement` | FTA/PTA definition | agreement_code, name, parties, rules, effective_date |
| `OriginRule` | Rules of origin | rule_id, rule_type, hs_code, conditions, rvc_threshold |

### Enums

| Enum | Values |
|------|--------|
| `MaterialType` | RAW_MATERIAL, COMPONENT, SUBASSEMBLY, PACKAGING, SERVICE |
| `OriginStatus` | ORIGINATING, NON_ORIGINATING, UNKNOWN, CONDITIONAL |
| `VerdictType` | QUALIFIED, NOT_QUALIFIED, INSUFFICIENT_INFO, PENDING, CONDITIONAL, MANUAL_REVIEW |
| `AssessmentStatus` | PENDING, IN_PROGRESS, COMPLETED, FAILED, REQUIRES_REVIEW |
| `ConfidenceLevel` | VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH |
| `AgreementType` | FREE_TRADE_AGREEMENT, CUSTOMS_UNION, PREFERENTIAL_TRADE_AGREEMENT, ECONOMIC_PARTNERSHIP |
| `OriginRuleType` | CHANGE_IN_TARIFF_CLASSIFICATION, REGIONAL_VALUE_CONTENT, SPECIFIC_PROCESS, WHOLLY_OBTAINED, MIXED |

## Import Examples

```python
from backend.app.contracts.psra import (
    # Core models
    Material, MaterialType, OriginStatus,
    Product,
    BOMNode, BillOfMaterials,

    # Assessment models
    Assessment, AssessmentStatus,
    ComprehensiveVerdict, VerdictType,
    RuleApplication,
    AssessmentMetrics,
    ConfidenceLevel,

    # Trade agreement models
    TradeAgreement, AgreementType,
    OriginRule, OriginRuleType,

    # Supporting models
    MonetaryValue,
    Agreement,
    Citation,
    DisqualificationReason,
    Severity,
)
```

## Quick Examples

### Create a Material
```python
from decimal import Decimal

material = Material(
    material_id="MAT-001",
    hs_code="390110",
    description="Polyethylene resin",
    material_type=MaterialType.RAW_MATERIAL,
    percentage=Decimal("45.5"),
    origin_country="CA",
    value=MonetaryValue(amount=1000.00, currency="USD"),
    origin_status=OriginStatus.ORIGINATING
)
```

### Create a Product
```python
product = Product(
    product_code="PROD-12345",
    description="Automotive plastic component",
    hs_code="870829",
    declared_origin="CA",
    materials=[material],
    ex_works_price=MonetaryValue(amount=5000.00, currency="USD"),
    production_country="CA"
)
```

### Create a Verdict
```python
verdict = ComprehensiveVerdict(
    verdict=VerdictType.QUALIFIED,
    confidence=0.92,
    explanation="Product qualifies under CETA",
    rules_applied=[rule_application],
    disqualification_reasons=[],
    recommendations=["Maintain current sourcing"],
    required_actions=[]
)
```

### Create an Assessment
```python
from uuid import uuid4
from datetime import datetime

assessment = Assessment(
    assessment_id=uuid4(),
    product=product,
    agreement=Agreement(code="CETA", name="CETA"),
    assessed_at=datetime.utcnow(),
    assessed_by="psra-engine-v1",
    status=AssessmentStatus.COMPLETED,
    verdict=verdict,
    metrics=AssessmentMetrics(
        processing_time_ms=1234.5,
        rules_evaluated=2,
        materials_analyzed=5
    )
)
```

## Key Validation Rules

### Material
- ✅ Percentage: 0-100, max 4 decimal places
- ✅ HS code: 4-10 digits
- ✅ Country code: ISO 3166-1 alpha-2

### Product
- ✅ Material IDs must be unique
- ✅ Material percentages total ≤ 100.01%
- ✅ HS code: 6-10 digits

### BOM
- ✅ Root nodes at level 0
- ✅ Children exactly one level deeper than parent
- ✅ Version: semantic versioning

### Verdict
- ✅ NOT_QUALIFIED → must have disqualification_reasons
- ✅ QUALIFIED/NOT_QUALIFIED/CONDITIONAL → must have rules_applied
- ✅ Confidence: 0-1

### Assessment
- ✅ COMPLETED → cannot have PENDING verdict

### Trade Agreement
- ✅ Parties must be unique
- ✅ Expiry date > effective date
- ✅ RVC rules must have threshold

## Serialization

```python
# Method 1: Pydantic's built-in
json_dict = model.model_dump(mode="json")

# Method 2: Custom method (if available)
json_dict = model.to_json_dict()

# To JSON string
import json
json_string = json.dumps(json_dict, indent=2)
```

## Computed Fields

| Model | Computed Field | Description |
|-------|----------------|-------------|
| `HSCode` | `full_code` | Full 6-digit HS code |
| `Product` | `total_material_value` | Sum of material values |
| `Product` | `originating_material_percentage` | % originating by value |
| `BOMNode` | `total_nodes` | Count of nodes in subtree |
| `BillOfMaterials` | `total_material_count` | Total material count |
| `BillOfMaterials` | `max_depth` | Maximum tree depth |
| `RuleApplication` | `confidence_level` | Categorized confidence |
| `ComprehensiveVerdict` | `confidence_level` | Categorized confidence |
| `ComprehensiveVerdict` | `is_qualified` | Boolean qualification status |

## Helper Methods

| Model | Method | Description |
|-------|--------|-------------|
| `BOMNode` | `flatten()` | Get all materials as flat list |
| `BillOfMaterials` | `get_all_materials()` | Get all materials in BOM |
| `TradeAgreement` | `is_active(date)` | Check if agreement is active |
| `TradeAgreement` | `get_rules_for_hs_code(hs)` | Get rules for HS code |
| `Assessment` | `summary()` | Human-readable summary |

## Common Patterns

### Hierarchical BOM
```python
# Level 2 (leaves)
leaf = BOMNode(material=leaf_material, children=[], level=2, quantity=Decimal("5.0"))

# Level 1 (intermediate)
intermediate = BOMNode(material=int_material, children=[leaf], level=1, quantity=Decimal("2.0"))

# Level 0 (root)
root = BOMNode(material=root_material, children=[intermediate], level=0, quantity=Decimal("1.0"))

# Create BOM
bom = BillOfMaterials(
    bom_id="BOM-001",
    product_code="PROD-001",
    version="1.0",
    effective_date=date.today(),
    root_nodes=[root]
)
```

### Complete Assessment Flow
```python
# 1. Create materials
materials = [material1, material2, ...]

# 2. Create product
product = Product(...)

# 3. Apply rules
rule_application = RuleApplication(...)

# 4. Create verdict
verdict = ComprehensiveVerdict(...)

# 5. Create assessment
assessment = Assessment(...)

# 6. Get summary
print(assessment.summary())
```

## Configuration

All models inherit from `PSRABaseModel` with:
- `extra="forbid"` - No extra fields allowed
- `frozen=True` - Immutable after creation
- `str_strip_whitespace=True` - Auto-strip whitespace

## Python Version Compatibility

- **Required:** Python 3.11+
- **Compatible:** Python 3.10 (uses `typing_extensions.Self`)

## Dependencies

```toml
pydantic = "^2.5.0"
typing-extensions = "*"  # For Python 3.10 compatibility
```

## Best Practices

1. **Use Decimal for percentages and monetary values**
   ```python
   from decimal import Decimal
   percentage = Decimal("45.5")  # Not 45.5
   ```

2. **Always validate on creation**
   ```python
   try:
       material = Material(...)
   except ValidationError as e:
       print(e.errors())
   ```

3. **Use type hints**
   ```python
   def process_assessment(assessment: Assessment) -> ComprehensiveVerdict:
       return assessment.verdict
   ```

4. **Leverage computed fields**
   ```python
   # Don't manually calculate
   percentage = product.originating_material_percentage  # Use computed field
   ```

5. **Use enums for categorical data**
   ```python
   status = AssessmentStatus.COMPLETED  # Not "completed"
   ```

## Troubleshooting

### Common Errors

1. **"Material IDs must be unique"**
   - Check for duplicate material_id values in product.materials

2. **"Material percentages sum to X%, exceeding 100%"**
   - Ensure material percentages don't exceed 100%

3. **"NOT_QUALIFIED verdict must include disqualification reason"**
   - Add at least one DisqualificationReason

4. **"Child level must be exactly one more than parent level"**
   - Fix BOM hierarchy levels (0, 1, 2, ...)

5. **"RVC rules must specify rvc_threshold"**
   - Set rvc_threshold for REGIONAL_VALUE_CONTENT rules

## Resources

- Full Documentation: `PSRA_MODELS_DOCUMENTATION.md`
- Source Code: `backend/app/contracts/psra.py`
- Tests: `tests/backend/contracts/test_psra_contracts.py`

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-10-13
