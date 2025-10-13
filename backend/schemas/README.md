# PSRA Rules-as-Code JSON Schema v2

Comprehensive JSON Schema for PSRA (Preferential Status Rules Assessment) origin rules supporting international trade agreements.

## Overview

This directory contains strict JSON Schema definitions for validating PSRA Rules-as-Code (RaC) YAML files. The schema enforces comprehensive validation for preferential origin rules under trade agreements including:

- **CETA** - Comprehensive Economic and Trade Agreement (EU-Canada)
- **TCA** - EU-UK Trade and Cooperation Agreement
- **EU-JP-EPA** - EU-Japan Economic Partnership Agreement
- **USMCA** - United States-Mexico-Canada Agreement
- **RCEP** - Regional Comprehensive Economic Partnership

## Schema Files

### psr_rule.schema.v2.json

Primary JSON Schema (Draft 07) for validating PSRA origin rules.

**Key Features:**
- Strict validation with `additionalProperties: false`
- Comprehensive field-level documentation with `$comment` annotations
- Pattern matching for identifiers, codes, and references
- Cross-field validation constraints
- Enum constraints for standardized values
- Range validations for numeric fields
- Three complete examples (CETA, TCA, EU-JP EPA)

## Schema Structure

### Top-Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | Yes | Semantic version (2.x.x format) |
| `metadata` | object | Yes | Rule identification and lifecycle |
| `criteria` | object | Yes | Origin qualification requirements |
| `decision` | object | Yes | Qualification/disqualification verdicts |
| `audit` | object | Yes | Traceability and governance |

### 1. Metadata

Identifies and categorizes the origin rule.

**Key Fields:**
```yaml
metadata:
  rule_id: "CETA-HS39-001"              # Format: {AGREEMENT}-HS{CHAPTER}-{SEQ}
  title: "Polymerization requirement"    # Human-readable title
  description: "Detailed description"    # Full rule explanation
  agreement:
    code: "CETA"                         # Trade agreement code
    name: "Comprehensive Economic..."    # Full agreement name
  hs_code:
    chapter: "39"                        # 2-digit HS chapter
    heading: "3901"                      # 4-digit HS heading
    subheading: "390110"                 # 6-digit HS subheading
  jurisdiction:                          # ISO 3166-1 alpha-2 codes
    - "EU"
    - "CA"
  effective_from: "2024-01-01"          # ISO 8601 date
  effective_to: null                     # Optional expiry date
  priority: 1                            # 0-999 (0 = highest)
  supersedes: []                         # List of replaced rule IDs
```

**Validation Rules:**
- `rule_id`: Pattern `^[A-Z]{2,5}-HS[0-9]{2}-[0-9]{3}$`
- `agreement.code`: Enum of valid agreement codes
- HS code hierarchy: subheading must start with heading, heading must start with chapter
- `jurisdiction`: Unique ISO 3166-1 alpha-2 codes
- `priority`: Integer 0-999

### 2. Criteria

Defines requirements for origin qualification across three pillars:

#### 2.1 Bill of Materials (BOM)

```yaml
criteria:
  bom:
    required_inputs:                     # Materials that must be present
      - type: "material"                 # material | component | service
        hs_code: "2710"                  # 4-8 digit HS code
        description: "Naphtha feedstock"
        max_percentage: 50.0             # Optional: max % by value
    regional_value_content:              # RVC calculation
      method: "build-up"                 # build-up | build-down | net-cost
      threshold: 60.0                    # 0-100 percentage
      calculation_window_days: 365       # 30-1095 days
    non_originating_materials:           # Optional: non-orig limits
      max_percentage: 40.0               # 0-100 percentage
```

**RVC Methods:**
- **build-up**: RVC = (VOM / EXW) × 100 (value of originating materials)
- **build-down**: RVC = ((EXW - VNM) / EXW) × 100 (minus non-originating)
- **net-cost**: RVC = ((NC - VNM) / NC) × 100 (net cost basis)

#### 2.2 Process Requirements

```yaml
criteria:
  process:
    required_operations:                 # Must be performed in territory
      - code: "POLYMERIZATION"           # UPPER_SNAKE_CASE format
        description: "Polymerization..."
    disallowed_operations:               # Insufficient processing
      - code: "PACKAGING"
        description: "Simple packaging"
```

**Validation Rules:**
- `required_operations`: Minimum 1 operation required
- `disallowed_operations`: Can be empty array
- Operation codes: Pattern `^[A-Z0-9_-]{3,32}$`

#### 2.3 Documentation Requirements

```yaml
criteria:
  documentation:
    certificates:                        # Required origin certificates
      - "EUR.1"
    record_retention_days: 3650          # 365-7300 days (1-20 years)
    additional_evidence:                 # Optional additional docs
      - type: "audit-report"             # kebab-case identifiers
        description: "Third-party audit"
```

### 3. Decision

Structured verdicts for both qualified and disqualified outcomes.

```yaml
decision:
  verdicts:
    qualified:
      description: "Meets all requirements"
      citations:
        - reference: "CETA Annex 5-A"
          section: "HS 39"                # Optional
          url: "https://..."              # Optional
    disqualified:
      reasons:
        - code: "INSUFFICIENT_RVC"        # UPPER_SNAKE_CASE
          description: "RVC below 60%"
          severity: "high"                # low|medium|high|critical
```

**Validation Rules:**
- Both `qualified` and `disqualified` verdicts required
- Minimum 1 citation for qualified verdict
- Minimum 1 reason for disqualified verdict
- Unique disqualification reason codes

### 4. Audit

Traceability and governance information.

```yaml
audit:
  traceability:
    lineage_required: true               # Boolean
    ledger_reference: "ledger://psra/v1" # ledger:// URI scheme
  last_reviewed: "2025-01-15"            # ISO 8601 date
  reviewer: "compliance-board"           # kebab-case identifier
```

## Validation

### Using JSON Schema Validators

```bash
# Python with jsonschema
pip install jsonschema pyyaml
python3 -c "
import yaml
import json
from jsonschema import validate

# Load schema
with open('backend/schemas/psr_rule.schema.v2.json') as f:
    schema = json.load(f)

# Load rule YAML
with open('psr/rules/hs39/ceta_polymer_rule.yaml') as f:
    rule = yaml.safe_load(f)

# Validate
validate(instance=rule, schema=schema)
print('Validation successful!')
"
```

### Using the PSR Validator

```bash
# Validate all rules
cd /home/vncuser/psra-ltsd-enterprise-v2
python3 -m psr.loader.psr_loader \
  --schema backend/schemas/psr_rule.schema.v2.json \
  --rules-dir psr/rules

# Validate specific rule
python3 -m psr.loader.psr_loader \
  --schema backend/schemas/psr_rule.schema.v2.json \
  --rules-dir psr/rules/hs39 \
  --format json
```

### Using Pydantic Models

The schema aligns with Pydantic models in `/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py`:

```python
from backend.app.contracts.psra import PSRARule
import yaml

# Load and validate using Pydantic
with open('psr/rules/hs39/ceta_polymer_rule.yaml') as f:
    rule_data = yaml.safe_load(f)

rule = PSRARule.model_validate(rule_data)
print(f"Validated rule: {rule.metadata.rule_id}")
```

## Common Patterns

### Standard Agreement Codes

| Code | Name | Parties |
|------|------|---------|
| CETA | Comprehensive Economic and Trade Agreement | EU, CA |
| TCA | EU-UK Trade and Cooperation Agreement | EU, UK |
| EU-UK-TCA | Same as TCA (alternative code) | EU, UK |
| EU-JP-EPA | EU-Japan Economic Partnership Agreement | EU, JP |
| EUJP | Same as EU-JP-EPA (short code) | EU, JP |
| USMCA | United States-Mexico-Canada Agreement | US, MX, CA |
| RCEP | Regional Comprehensive Economic Partnership | 15 Asia-Pacific countries |

### Common RVC Thresholds

| Agreement | Method | Threshold | Notes |
|-----------|--------|-----------|-------|
| CETA | build-up | 60% | Most industrial goods |
| TCA | net-cost | 60% | With 40% non-orig limit |
| EU-JP EPA | build-down | 50% | Standard for electronics |
| USMCA | net-cost | 75% | Automotive (62.5% transitional) |

### Common Operation Codes

**Substantive Operations (required_operations):**
- `POLYMERIZATION` - Chemical polymerization
- `VULCANIZATION` - Rubber vulcanization
- `EXTRUSION` - Material extrusion/shaping
- `CUTTING` - Precision cutting operations
- `WELDING` - Welding/joining
- `ASSEMBLY` - Complex assembly
- `HEAT-TREATMENT` - Heat treatment processes
- `WAFER-FABRICATION` - Semiconductor fabrication
- `DIE-ASSEMBLY` - Semiconductor assembly

**Insufficient Operations (disallowed_operations):**
- `PACKAGING` - Simple packaging
- `LABELING` - Affixing labels
- `MARKING` - Simple marking
- `SIMPLE-TESTING` - Testing without production
- `SORTING` - Sorting operations
- `REPACKAGING` - Repackaging only

### Common Disqualification Codes

| Code | Description | Typical Severity |
|------|-------------|------------------|
| `INSUFFICIENT_RVC` | RVC below threshold | high |
| `MISSING_PROCESS` | Required process not performed | critical |
| `EXCESS_NON_ORIGINATING` | Too many non-originating materials | high |
| `PROCESS_NOT_COMPLETED` | Process not finished in territory | medium/high |
| `INVALID_CERTIFICATE` | Missing or invalid certificates | high |
| `DISALLOWED_OPERATION_PERFORMED` | Only insufficient operations | critical |
| `MISSING_FABRICATION` | Key fabrication step missing | critical |
| `TARIFF_JUMP_NOT_MET` | Change in tariff classification not met | high |

## Integration with PSRA System

### File Locations

```
/home/vncuser/psra-ltsd-enterprise-v2/
├── backend/
│   ├── schemas/
│   │   ├── psr_rule.schema.v2.json      # This schema
│   │   └── README.md                     # This file
│   ├── app/
│   │   └── contracts/
│   │       └── psra.py                   # Pydantic models
│   └── app/
│       └── etl/
│           └── ingest_rules.py           # ETL pipeline
└── psr/
    ├── schema/
    │   └── psr_rule.schema.v2.json       # Original schema (for reference)
    ├── rules/                             # Rule YAML files
    │   ├── hs39/
    │   │   └── ceta_polymer_rule.yaml
    │   └── hs40/
    │       └── tca_rubber_rule.yaml
    └── loader/
        └── psr_loader.py                  # Validation CLI
```

### ETL Pipeline

Rules validated by this schema are ingested into PostgreSQL via:

```python
# backend/app/etl/ingest_rules.py
python3 -m backend.app.etl.ingest_rules \
  --rules-dir psr/rules \
  --schema backend/schemas/psr_rule.schema.v2.json \
  --validate \
  --dsn "postgresql://user:pass@host:5432/dbname"
```

The ETL pipeline:
1. Validates YAML against JSON Schema
2. Parses into Pydantic models
3. Runs Great Expectations data quality checks
4. Upserts into PostgreSQL tables

### API Endpoints

Rules stored in the database are accessible via REST API:

```bash
# Get rule by ID
GET /api/rules/{rule_id}

# Search rules by HS code
GET /api/rules?hs_code=390110

# Search rules by agreement
GET /api/rules?agreement=CETA

# Evaluate product origin
POST /api/evaluate
{
  "product": {...},
  "agreement": "CETA",
  "hs_code": "390110"
}
```

## Examples

The schema includes three complete examples:

### Example 1: CETA Polymer Rule (HS 39.01)
- Build-up RVC method with 60% threshold
- Requires polymerization and extrusion in territory
- Maximum 50% naphtha feedstock
- 10-year record retention

### Example 2: TCA Rubber Rule (HS 40.11)
- Net-cost RVC method with 60% threshold
- Maximum 40% non-originating materials
- Requires vulcanization in EU or UK
- 6-year record retention

### Example 3: EU-JP EPA Electronics Rule (HS 85.42)
- Build-down RVC method with 50% threshold
- Requires wafer fabrication, die assembly, and testing
- Extensive documentation (design, manufacturing, supplier declarations)
- 5-year record retention

## Versioning

Schema versions follow semantic versioning:

- **2.0.0** - Initial comprehensive schema aligned with Pydantic models
- **2.1.0** - Added support for extended trade agreements (EU-JP EPA)
- **2.x.x** - Future enhancements (maintain backward compatibility)

### Migration from v1

Key differences from psr/schema/psr_rule.schema.v2.json:

1. Enhanced documentation with $comment fields
2. Stricter validation patterns
3. Expanded agreement code enums
4. Additional examples (3 vs 2)
5. Comprehensive field descriptions
6. Backend-specific location (/backend/schemas/)

## Best Practices

### Creating New Rules

1. **Start with an example**: Copy an existing rule YAML that's closest to your use case
2. **Validate incrementally**: Validate after each major section (metadata, criteria, decision)
3. **Use consistent naming**: Follow UPPER_SNAKE_CASE for codes, kebab-case for identifiers
4. **Document thoroughly**: Provide clear descriptions explaining requirements
5. **Test with edge cases**: Ensure rule handles boundary conditions correctly

### Rule ID Convention

```
{AGREEMENT_CODE}-HS{CHAPTER}-{SEQUENCE}
```

- Agreement code: 2-5 uppercase letters (CETA, TCA, EUJP)
- Chapter: 2-digit HS chapter with leading zero
- Sequence: 3-digit sequential number (001-999)

Examples:
- `CETA-HS39-001` - First CETA rule for HS chapter 39
- `TCA-HS40-002` - Second TCA rule for HS chapter 40
- `EUJP-HS84-015` - Fifteenth EU-JP EPA rule for HS chapter 84

### Priority Assignment

- **0-9**: Critical/frequently-used rules (e.g., de minimis, wholly obtained)
- **10-99**: Standard product-specific rules
- **100-499**: Specialized industry rules
- **500-999**: Exceptional/transitional rules

### Record Retention Guidelines

| Duration | Days | Use Case |
|----------|------|----------|
| 1 year | 365 | Minimum legal requirement |
| 3 years | 1095 | Standard for most FTAs |
| 5 years | 1825 | Enhanced compliance (EU-JP EPA) |
| 6 years | 2190 | UK TCA requirements |
| 10 years | 3650 | High-risk sectors (CETA polymers) |

## Troubleshooting

### Common Validation Errors

**Error: "Subheading must start with heading"**
```yaml
# Wrong
hs_code:
  chapter: "39"
  heading: "3901"
  subheading: "401110"  # Starts with 40, not 39

# Correct
hs_code:
  chapter: "39"
  heading: "3901"
  subheading: "390110"  # Starts with 3901
```

**Error: "required_operations must contain at least one operation"**
```yaml
# Wrong
process:
  required_operations: []  # Empty not allowed

# Correct
process:
  required_operations:
    - code: "PROCESSING"
      description: "Substantive processing in territory"
```

**Error: "At least one citation is required"**
```yaml
# Wrong
qualified:
  description: "Product qualifies"
  citations: []  # Empty not allowed

# Correct
qualified:
  description: "Product qualifies"
  citations:
    - reference: "CETA Annex 5-A"
      section: "HS 39"
```

## Support

For questions or issues with the schema:

1. **Check examples**: Review the three included examples
2. **Validate incrementally**: Use schema validator to identify specific issues
3. **Review Pydantic models**: Check `/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py`
4. **Test with ETL**: Run validation through the ETL pipeline

## References

- [JSON Schema Draft 07 Specification](https://json-schema.org/draft-07/schema)
- [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/)
- [PSRA Contracts Module](/home/vncuser/psra-ltsd-enterprise-v2/backend/app/contracts/psra.py)
- [PSR Loader CLI](/home/vncuser/psra-ltsd-enterprise-v2/psr/loader/psr_loader.py)
- [Rules Ingestion ETL](/home/vncuser/psra-ltsd-enterprise-v2/backend/app/etl/ingest_rules.py)

## License

Copyright 2025 PSRA-LTSD Enterprise. All rights reserved.
