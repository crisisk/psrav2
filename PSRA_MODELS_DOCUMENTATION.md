# PSRA Domain Models Documentation

## Overview

This document describes the comprehensive Pydantic v2 models created for the PSRA (Preferential Status Rules Assessment) system. These models are located in `/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py`.

## Key Features

All models implement:
- **Pydantic v2** with strict validation (`extra="forbid"`)
- **Immutability** (`frozen=True`) for data integrity
- **Type safety** with Annotated types
- **Comprehensive field validators** for business rule enforcement
- **Model validators** for cross-field validation
- **JSON serialization** support via `to_json_dict()` methods
- **Computed fields** for derived properties
- **Rich docstrings** with examples

## Domain Model Categories

### 1. Material and Product Models

#### `MaterialType` (Enum)
Classification of material types:
- `RAW_MATERIAL` - Raw materials
- `COMPONENT` - Components
- `SUBASSEMBLY` - Sub-assemblies
- `PACKAGING` - Packaging materials
- `SERVICE` - Services

#### `OriginStatus` (Enum)
Origin determination status:
- `ORIGINATING` - Material is originating
- `NON_ORIGINATING` - Material is non-originating
- `UNKNOWN` - Status unknown
- `CONDITIONAL` - Conditionally originating

#### `Material` (PSRABaseModel)
Represents a material or component used in production.

**Key Attributes:**
- `material_id`: Unique identifier (1-64 chars)
- `hs_code`: Harmonized System code (4-10 digits)
- `description`: Human-readable description (3-512 chars)
- `material_type`: Classification type
- `percentage`: Percentage in final product (0-100, 4 decimal places)
- `origin_country`: ISO 3166-1 alpha-2 country code
- `value`: Monetary value with currency
- `origin_status`: Origin determination status
- `supplier_reference`: Optional supplier part number
- `parent_material_id`: For hierarchical structures
- `customs_value`: Optional customs value
- `weight_kg`: Optional weight in kilograms

**Validators:**
- Percentage precision limited to 4 decimal places
- All string fields are stripped of whitespace

**Methods:**
- `to_json_dict()`: Serialize to JSON-compatible dictionary

**Example:**
```python
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

#### `Product` (PSRABaseModel)
Represents a finished product or good.

**Key Attributes:**
- `product_code`: Internal product identifier/SKU (1-100 chars)
- `description`: Product description (3-512 chars)
- `hs_code`: Product's HS classification (6-10 digits)
- `declared_origin`: Declared country of origin
- `materials`: List of constituent materials
- `ex_works_price`: Factory/ex-works value
- `fob_price`: Optional FOB price
- `production_country`: Country where production occurred
- `manufacturer`: Optional manufacturer identifier
- `certification_references`: List of certification references

**Validators:**
- Material IDs must be unique within product
- Material percentages cannot exceed 100.01% total

**Computed Fields:**
- `total_material_value`: Sum of all material values
- `originating_material_percentage`: Percentage of originating materials by value

**Methods:**
- `to_json_dict()`: Serialize to JSON-compatible dictionary

**Example:**
```python
product = Product(
    product_code="PROD-12345",
    description="Automotive plastic component",
    hs_code="870829",
    declared_origin="CA",
    materials=[material1, material2],
    ex_works_price=MonetaryValue(amount=5000.00, currency="USD"),
    production_country="CA"
)
```

### 2. Bill of Materials (BOM) Models

#### `BOMNode` (PSRABaseModel)
Represents a node in a hierarchical BOM tree.

**Key Attributes:**
- `material`: The material at this node
- `children`: Child nodes (sub-materials/components)
- `level`: Depth level in BOM tree (0-20)
- `quantity`: Quantity of material used
- `unit_of_measure`: Unit (default: "EA")

**Validators:**
- Children must have level exactly one more than parent

**Computed Fields:**
- `total_nodes`: Total count of nodes in subtree

**Methods:**
- `flatten()`: Flatten BOM tree to list of all materials

#### `BillOfMaterials` (PSRABaseModel)
Complete Bill of Materials with hierarchical structure.

**Key Attributes:**
- `bom_id`: Unique identifier (1-64 chars)
- `product_code`: Reference to finished product
- `version`: BOM version number (semantic versioning)
- `effective_date`: When BOM becomes effective
- `root_nodes`: Top-level materials/assemblies (minimum 1)
- `created_at`: Creation timestamp
- `created_by`: User/system that created BOM
- `notes`: Optional notes (max 2048 chars)

**Validators:**
- All root nodes must be at level 0
- Version must follow semantic versioning pattern

**Computed Fields:**
- `total_material_count`: Total count of all materials
- `max_depth`: Maximum depth of BOM tree

**Methods:**
- `get_all_materials()`: Get flattened list of all materials
- `to_json_dict()`: Serialize to JSON

**Example:**
```python
bom = BillOfMaterials(
    bom_id="BOM-12345",
    product_code="PROD-12345",
    version="1.0",
    effective_date=date.today(),
    root_nodes=[root_node]
)
```

### 3. Assessment and Verdict Models

#### `AssessmentStatus` (Enum)
Status of an origin assessment:
- `PENDING` - Assessment pending
- `IN_PROGRESS` - Currently being assessed
- `COMPLETED` - Assessment completed
- `FAILED` - Assessment failed
- `REQUIRES_REVIEW` - Requires manual review

#### `VerdictType` (Enum)
Comprehensive verdict types:
- `QUALIFIED` - Product qualifies for preferential treatment
- `NOT_QUALIFIED` - Product does not qualify
- `INSUFFICIENT_INFO` - Insufficient information to determine
- `PENDING` - Assessment pending
- `CONDITIONAL` - Conditionally qualified
- `MANUAL_REVIEW` - Requires manual review

#### `ConfidenceLevel` (Enum)
Confidence level categories:
- `VERY_LOW` - 0-0.3
- `LOW` - 0.3-0.5
- `MEDIUM` - 0.5-0.7
- `HIGH` - 0.7-0.9
- `VERY_HIGH` - 0.9-1.0

#### `RuleApplication` (PSRABaseModel)
Records application of a specific rule during assessment.

**Key Attributes:**
- `rule_id`: Identifier of applied rule
- `rule_title`: Human-readable rule title
- `outcome`: Whether rule passed, failed, or is conditional
- `confidence`: Confidence in rule application (0-1)
- `explanation`: Why rule was applied and outcome
- `matched_criteria`: Criteria that were matched
- `failed_criteria`: Criteria that were not met
- `citations`: Relevant legal citations

**Computed Fields:**
- `confidence_level`: Categorized confidence level

#### `AssessmentMetrics` (PSRABaseModel)
Performance metrics for assessment.

**Key Attributes:**
- `processing_time_ms`: Total processing time
- `rules_evaluated`: Number of rules evaluated
- `materials_analyzed`: Number of materials analyzed
- `api_calls_made`: External API calls made
- `cache_hits`: Number of cache hits
- `llm_tokens_used`: Optional LLM token count

#### `ComprehensiveVerdict` (PSRABaseModel)
Comprehensive verdict with detailed reasoning.

**Key Attributes:**
- `verdict`: The primary verdict type
- `confidence`: Overall confidence score (0-1)
- `explanation`: Detailed explanation (10-8192 chars)
- `rules_applied`: List of rules that were applied
- `disqualification_reasons`: Reasons for disqualification (if any)
- `recommendations`: Recommendations for improvement
- `required_actions`: Actions needed to achieve qualification

**Validators:**
- NOT_QUALIFIED verdicts must have disqualification reasons
- Non-pending verdicts must have at least one rule applied

**Computed Fields:**
- `confidence_level`: Categorized confidence level
- `is_qualified`: Boolean indicating if product qualifies

**Methods:**
- `to_json_dict()`: Serialize to JSON

**Example:**
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

#### `Assessment` (PSRABaseModel)
Top-level comprehensive origin assessment result.

**Key Attributes:**
- `assessment_id`: Unique UUID
- `product`: The product being assessed
- `agreement`: Trade agreement being evaluated
- `assessed_at`: Timestamp of assessment
- `assessed_by`: System or user performing assessment
- `status`: Current assessment status
- `verdict`: Comprehensive verdict
- `metrics`: Performance metrics
- `bom`: Optional full BOM used
- `provenance`: Audit trail and provenance
- `notes`: Optional notes (max 4096 chars)
- `ledger_reference`: Optional blockchain/ledger reference

**Validators:**
- Completed assessments cannot have PENDING verdict

**Methods:**
- `to_json_dict()`: Serialize to JSON
- `summary()`: Generate human-readable summary

**Example:**
```python
assessment = Assessment(
    assessment_id=uuid4(),
    product=product,
    agreement=Agreement(code="CETA", name="CETA"),
    assessed_at=datetime.utcnow(),
    assessed_by="psra-engine-v1",
    status=AssessmentStatus.COMPLETED,
    verdict=verdict,
    metrics=metrics
)
```

### 4. Trade Agreement Models

#### `AgreementType` (Enum)
Types of trade agreements:
- `FREE_TRADE_AGREEMENT` - FTA
- `CUSTOMS_UNION` - Customs union
- `PREFERENTIAL_TRADE_AGREEMENT` - PTA
- `ECONOMIC_PARTNERSHIP` - Economic partnership

#### `OriginRuleType` (Enum)
Types of rules of origin:
- `CHANGE_IN_TARIFF_CLASSIFICATION` - CTH/CTSH rule
- `REGIONAL_VALUE_CONTENT` - RVC rule
- `SPECIFIC_PROCESS` - Process-based rule
- `WHOLLY_OBTAINED` - Wholly obtained rule
- `MIXED` - Mixed criteria

#### `OriginRule` (PSRABaseModel)
Detailed origin rule definition.

**Key Attributes:**
- `rule_id`: Unique identifier
- `rule_type`: Type of origin rule
- `hs_code`: HS code(s) this rule applies to
- `description`: Human-readable description
- `conditions`: List of conditions that must be met
- `required_cth`: Optional change in tariff heading
- `required_ctsh`: Optional change in tariff subheading
- `rvc_threshold`: Optional RVC threshold percentage
- `allowed_operations`: Operations that preserve origin
- `disallowed_operations`: Operations that break origin
- `exceptions`: List of exceptions

**Validators:**
- RVC rules must specify rvc_threshold

**Example:**
```python
rule = OriginRule(
    rule_id="CETA-HS39-001",
    rule_type=OriginRuleType.REGIONAL_VALUE_CONTENT,
    hs_code="390110",
    description="Polymers must have 50% RVC",
    conditions=["RVC >= 50%", "Production in party country"],
    rvc_threshold=Decimal("50.0")
)
```

#### `TradeAgreement` (PSRABaseModel)
Comprehensive trade agreement model.

**Key Attributes:**
- `agreement_code`: Short code (e.g., "CETA")
- `name`: Full name of agreement
- `agreement_type`: Type of agreement
- `parties`: List of party country codes (minimum 2)
- `effective_date`: When agreement came into force
- `expiry_date`: Optional expiry date
- `rules`: List of origin rules
- `cumulation_allowed`: Whether cumulation is allowed
- `cumulation_partners`: Countries for cumulation
- `de_minimis_threshold`: Optional de minimis threshold
- `product_specific_rules`: Additional product-specific rules
- `official_url`: Optional official URL
- `notes`: Optional notes

**Validators:**
- Party country codes must be unique
- Cumulation partners require cumulation_allowed=True
- Expiry date must be after effective date

**Methods:**
- `is_active(as_of: date)`: Check if agreement is active on date
- `get_rules_for_hs_code(hs_code: str)`: Get applicable rules
- `to_json_dict()`: Serialize to JSON

**Example:**
```python
agreement = TradeAgreement(
    agreement_code="CETA",
    name="Canada-European Union Comprehensive Economic and Trade Agreement",
    agreement_type=AgreementType.FREE_TRADE_AGREEMENT,
    parties=["CA", "BE", "BG", "HR", "CY", "CZ", ...],
    effective_date=date(2017, 9, 21),
    rules=[rule1, rule2],
    cumulation_allowed=True,
    de_minimis_threshold=Decimal("10")
)
```

## Type Aliases

The following type aliases are defined for common patterns:

- `RuleId`: Pattern `^[A-Z]{2,5}-HS[0-9]{2}-[0-9]{3}$`
- `JurisdictionCode`: Pattern `^[A-Z]{2}$`
- `AgreementCode`: Pattern `^[A-Z0-9]{2,10}$`
- `HSChapter`: Pattern `^[0-9]{2}$`
- `HSHeading`: Pattern `^[0-9]{4}$`
- `HSSubheading`: Pattern `^[0-9]{6}$`
- `OperationCode`: Pattern `^[A-Z0-9_-]{3,32}$`
- `ReasonCode`: Pattern `^[A-Z0-9_]{3,32}$`
- `CertificateCode`: Length 2-64
- `EvidenceType`: Pattern `^[a-z0-9-]+$`
- `CountryCode`: Pattern `^[A-Z]{2}$`
- `CurrencyCode`: Pattern `^[A-Z]{3}$`

## Usage Examples

### Creating a Complete Assessment

```python
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

# Create materials
material1 = Material(
    material_id="MAT-001",
    hs_code="390110",
    description="Polyethylene resin",
    material_type=MaterialType.RAW_MATERIAL,
    percentage=Decimal("60.0"),
    origin_country="CA",
    value=MonetaryValue(amount=3000.00, currency="USD"),
    origin_status=OriginStatus.ORIGINATING
)

material2 = Material(
    material_id="MAT-002",
    hs_code="390120",
    description="Additives",
    material_type=MaterialType.RAW_MATERIAL,
    percentage=Decimal("40.0"),
    origin_country="US",
    value=MonetaryValue(amount=2000.00, currency="USD"),
    origin_status=OriginStatus.NON_ORIGINATING
)

# Create product
product = Product(
    product_code="PROD-12345",
    description="Automotive plastic component",
    hs_code="870829",
    declared_origin="CA",
    materials=[material1, material2],
    ex_works_price=MonetaryValue(amount=8000.00, currency="USD"),
    production_country="CA"
)

# Create rule application
rule_app = RuleApplication(
    rule_id="CETA-HS87-015",
    rule_title="Automotive parts RVC rule",
    outcome=VerdictType.QUALIFIED,
    confidence=0.88,
    explanation="Product meets 60% RVC requirement with originating value of 60%",
    matched_criteria=["regional_value_content", "production_location"],
    failed_criteria=[],
    citations=[Citation(reference="CETA Annex 5-A", section="87.08")]
)

# Create verdict
verdict = ComprehensiveVerdict(
    verdict=VerdictType.QUALIFIED,
    confidence=0.88,
    explanation="Product qualifies for CETA preferential treatment",
    rules_applied=[rule_app],
    disqualification_reasons=[],
    recommendations=["Monitor originating material percentage"],
    required_actions=[]
)

# Create metrics
metrics = AssessmentMetrics(
    processing_time_ms=1234.5,
    rules_evaluated=2,
    materials_analyzed=2,
    api_calls_made=3,
    cache_hits=1
)

# Create assessment
assessment = Assessment(
    assessment_id=uuid4(),
    product=product,
    agreement=Agreement(code="CETA", name="Canada-EU CETA"),
    assessed_at=datetime.utcnow(),
    assessed_by="psra-engine-v1",
    status=AssessmentStatus.COMPLETED,
    verdict=verdict,
    metrics=metrics,
    provenance={"version": "1.0", "source": "automated"}
)

# Generate summary
print(assessment.summary())
# Output: Assessment <uuid>: Product PROD-12345 under CETA - QUALIFIED (confidence: 88.00%)

# Serialize to JSON
json_data = assessment.to_json_dict()
```

### Working with Hierarchical BOMs

```python
# Create leaf materials
leaf1 = Material(
    material_id="LEAF-001",
    hs_code="390110",
    description="Raw resin",
    material_type=MaterialType.RAW_MATERIAL,
    percentage=Decimal("100.0"),
    origin_country="CA",
    value=MonetaryValue(amount=500.00, currency="USD"),
    origin_status=OriginStatus.ORIGINATING
)

leaf2 = Material(
    material_id="LEAF-002",
    hs_code="390120",
    description="Colorant",
    material_type=MaterialType.RAW_MATERIAL,
    percentage=Decimal("100.0"),
    origin_country="US",
    value=MonetaryValue(amount=100.00, currency="USD"),
    origin_status=OriginStatus.NON_ORIGINATING
)

# Create intermediate assembly
intermediate = Material(
    material_id="INT-001",
    hs_code="870829",
    description="Molded part",
    material_type=MaterialType.COMPONENT,
    percentage=Decimal("100.0"),
    origin_country="CA",
    value=MonetaryValue(amount=800.00, currency="USD"),
    origin_status=OriginStatus.ORIGINATING
)

# Build BOM tree
leaf_node1 = BOMNode(material=leaf1, children=[], level=2, quantity=Decimal("5.0"))
leaf_node2 = BOMNode(material=leaf2, children=[], level=2, quantity=Decimal("0.5"))

intermediate_node = BOMNode(
    material=intermediate,
    children=[leaf_node1, leaf_node2],
    level=1,
    quantity=Decimal("2.0")
)

root_material = Material(
    material_id="ROOT-001",
    hs_code="870899",
    description="Final assembly",
    material_type=MaterialType.SUBASSEMBLY,
    percentage=Decimal("100.0"),
    origin_country="CA",
    value=MonetaryValue(amount=2000.00, currency="USD"),
    origin_status=OriginStatus.ORIGINATING
)

root_node = BOMNode(
    material=root_material,
    children=[intermediate_node],
    level=0,
    quantity=Decimal("1.0")
)

# Create BOM
bom = BillOfMaterials(
    bom_id="BOM-2024-001",
    product_code="PROD-12345",
    version="1.0.0",
    effective_date=date.today(),
    root_nodes=[root_node]
)

print(f"Total materials: {bom.total_material_count}")  # 4
print(f"Max depth: {bom.max_depth}")  # 2
print(f"All materials: {len(bom.get_all_materials())}")  # 4
```

## Validation Rules

### Material Validation
- Percentage must be 0-100 with max 4 decimal places
- HS code must be 4-10 digits
- Origin country must be ISO 3166-1 alpha-2

### Product Validation
- Material IDs must be unique
- Total material percentages cannot exceed 100.01%
- HS code must be 6-10 digits

### BOM Validation
- Root nodes must be at level 0
- Child nodes must be exactly one level deeper than parent
- Version must follow semantic versioning pattern

### Verdict Validation
- NOT_QUALIFIED verdicts must have disqualification reasons
- QUALIFIED/NOT_QUALIFIED/CONDITIONAL verdicts must have rules applied
- Confidence must be 0-1

### Assessment Validation
- COMPLETED status cannot have PENDING verdict
- Assessment must include metrics

### Trade Agreement Validation
- Party countries must be unique
- Cumulation partners require cumulation_allowed=True
- Expiry date must be after effective date
- RVC rules must specify threshold

## Serialization

All models support JSON serialization via:
1. `model_dump(mode="json")` - Pydantic's built-in method
2. `to_json_dict()` - Custom method (where implemented) for enhanced control

Example:
```python
# Using Pydantic's method
json_dict = product.model_dump(mode="json")

# Using custom method
json_dict = product.to_json_dict()

# Convert to JSON string
import json
json_string = json.dumps(json_dict, indent=2)
```

## Backwards Compatibility

The following legacy models are retained for backwards compatibility:
- `RuleVerdicts`
- `RuleDecision`
- `EvaluationInput`
- `EvaluationOutput`
- `EvaluationVerdict`
- `EvaluationContext`

These coexist with the new comprehensive models.

## Testing

The models have been validated for:
- ✅ Python syntax correctness
- ✅ Pydantic v2 compatibility
- ✅ Type annotations
- ✅ Field validators
- ✅ Model validators
- ✅ Computed fields
- ✅ Serialization methods

## File Location

**Path:** `/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py`

**Lines of Code:** ~950+ lines including documentation

**Dependencies:**
- Python 3.11+ (uses `typing_extensions.Self` for Python 3.10 compatibility)
- Pydantic 2.5+
- typing_extensions

## Future Enhancements

Potential future improvements:
1. Add JSON Schema generation
2. Add OpenAPI schema integration
3. Add more comprehensive examples in docstrings
4. Add performance benchmarks
5. Add database ORM mappings
6. Add GraphQL schema generation
7. Add more granular validation error messages
8. Add internationalization support for messages

---

**Created:** 2025-10-13
**Version:** 1.0
**Status:** Production Ready
