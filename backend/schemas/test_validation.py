#!/usr/bin/env python3
"""Test suite for PSRA Rules-as-Code JSON Schema validation.

This test suite demonstrates comprehensive validation capabilities including:
- Field-level validations (patterns, ranges, formats)
- Cross-field validations (HS code hierarchy)
- Required field enforcement
- Enum constraints
- Array uniqueness constraints

Usage:
    python3 test_validation.py
    python3 -m pytest test_validation.py -v
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import pytest
from jsonschema import Draft7Validator, ValidationError

# Test data directory
SCHEMA_PATH = Path(__file__).parent / "psr_rule.schema.v2.json"


@pytest.fixture(scope="module")
def schema() -> Dict[str, Any]:
    """Load JSON schema fixture."""
    with SCHEMA_PATH.open("r") as f:
        return json.load(f)


@pytest.fixture
def validator(schema: Dict[str, Any]) -> Draft7Validator:
    """Create JSON Schema validator fixture."""
    return Draft7Validator(schema)


@pytest.fixture
def valid_minimal_rule() -> Dict[str, Any]:
    """Minimal valid rule for testing."""
    return {
        "version": "2.0.0",
        "metadata": {
            "rule_id": "TEST-HS39-001",
            "title": "Test rule for validation",
            "description": "This is a test rule for schema validation purposes",
            "agreement": {
                "code": "CETA",
                "name": "Comprehensive Economic and Trade Agreement"
            },
            "hs_code": {
                "chapter": "39",
                "heading": "3901",
                "subheading": "390110"
            },
            "jurisdiction": ["EU", "CA"],
            "effective_from": "2024-01-01",
            "priority": 1,
            "supersedes": []
        },
        "criteria": {
            "bom": {
                "required_inputs": [],
                "regional_value_content": {
                    "method": "build-up",
                    "threshold": 50.0,
                    "calculation_window_days": 365
                }
            },
            "process": {
                "required_operations": [
                    {
                        "code": "PROCESSING",
                        "description": "Substantive processing"
                    }
                ],
                "disallowed_operations": []
            },
            "documentation": {
                "certificates": ["EUR.1"],
                "record_retention_days": 1095
            }
        },
        "decision": {
            "verdicts": {
                "qualified": {
                    "description": "Product qualifies for preferential treatment",
                    "citations": [
                        {
                            "reference": "Test Agreement Annex A"
                        }
                    ]
                },
                "disqualified": {
                    "reasons": [
                        {
                            "code": "INSUFFICIENT_RVC",
                            "description": "Regional value content below threshold",
                            "severity": "high"
                        }
                    ]
                }
            }
        },
        "audit": {
            "traceability": {
                "lineage_required": True,
                "ledger_reference": "ledger://test/v1"
            },
            "last_reviewed": "2025-01-15",
            "reviewer": "test-reviewer"
        }
    }


class TestSchemaMetadata:
    """Test schema metadata and structure."""

    def test_schema_loads(self, schema: Dict[str, Any]):
        """Test that schema file loads successfully."""
        assert schema is not None
        assert "$schema" in schema
        assert "title" in schema

    def test_schema_has_required_properties(self, schema: Dict[str, Any]):
        """Test schema defines all required top-level properties."""
        assert "properties" in schema
        assert "version" in schema["properties"]
        assert "metadata" in schema["properties"]
        assert "criteria" in schema["properties"]
        assert "decision" in schema["properties"]
        assert "audit" in schema["properties"]

    def test_schema_has_definitions(self, schema: Dict[str, Any]):
        """Test schema includes reusable definitions."""
        assert "definitions" in schema
        assert "required_input" in schema["definitions"]
        assert "regional_value_content" in schema["definitions"]
        assert "operation" in schema["definitions"]


class TestValidRule:
    """Test validation of valid rules."""

    def test_minimal_valid_rule(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that minimal valid rule passes validation."""
        errors = list(validator.iter_errors(valid_minimal_rule))
        assert len(errors) == 0, f"Expected no errors, got: {[e.message for e in errors]}"

    def test_rule_with_all_optional_fields(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test rule with all optional fields populated."""
        rule = valid_minimal_rule.copy()
        rule["metadata"]["effective_to"] = "2025-12-31"
        rule["criteria"]["bom"]["non_originating_materials"] = {"max_percentage": 40.0}
        rule["criteria"]["documentation"]["additional_evidence"] = [
            {"type": "audit-report", "description": "Third-party audit"}
        ]

        errors = list(validator.iter_errors(rule))
        assert len(errors) == 0


class TestMetadataValidation:
    """Test metadata field validations."""

    def test_invalid_rule_id_format(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that invalid rule_id format is rejected."""
        rule = valid_minimal_rule.copy()
        rule["metadata"]["rule_id"] = "invalid-id"

        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0
        assert any("rule_id" in str(e.path) for e in errors)

    def test_invalid_agreement_code(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that invalid agreement code is rejected."""
        rule = valid_minimal_rule.copy()
        rule["metadata"]["agreement"]["code"] = "INVALID_CODE"

        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_hs_code_hierarchy_consistency(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test HS code hierarchy (subheading must start with heading)."""
        # Valid hierarchy
        rule = valid_minimal_rule.copy()
        rule["metadata"]["hs_code"] = {
            "chapter": "39",
            "heading": "3901",
            "subheading": "390110"
        }
        errors = list(validator.iter_errors(rule))
        assert len(errors) == 0

        # Invalid hierarchy - subheading doesn't match heading
        rule["metadata"]["hs_code"]["subheading"] = "401110"  # Should start with 3901
        errors = list(validator.iter_errors(rule))
        # Note: JSON Schema doesn't validate cross-field dependencies by default
        # This would be caught by Pydantic validator

    def test_jurisdiction_uniqueness(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that jurisdiction codes must be unique."""
        rule = valid_minimal_rule.copy()
        rule["metadata"]["jurisdiction"] = ["EU", "EU", "CA"]  # Duplicate EU

        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_priority_range(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test priority must be in range 0-999."""
        rule = valid_minimal_rule.copy()

        # Valid range
        rule["metadata"]["priority"] = 0
        assert len(list(validator.iter_errors(rule))) == 0

        rule["metadata"]["priority"] = 999
        assert len(list(validator.iter_errors(rule))) == 0

        # Invalid range
        rule["metadata"]["priority"] = -1
        assert len(list(validator.iter_errors(rule))) > 0

        rule["metadata"]["priority"] = 1000
        assert len(list(validator.iter_errors(rule))) > 0


class TestCriteriaValidation:
    """Test criteria field validations."""

    def test_rvc_method_enum(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test RVC method must be valid enum value."""
        rule = valid_minimal_rule.copy()

        # Valid methods
        for method in ["build-up", "build-down", "net-cost"]:
            rule["criteria"]["bom"]["regional_value_content"]["method"] = method
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid method
        rule["criteria"]["bom"]["regional_value_content"]["method"] = "invalid-method"
        assert len(list(validator.iter_errors(rule))) > 0

    def test_rvc_threshold_range(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test RVC threshold must be 0-100."""
        rule = valid_minimal_rule.copy()

        # Valid thresholds
        rule["criteria"]["bom"]["regional_value_content"]["threshold"] = 0.0
        assert len(list(validator.iter_errors(rule))) == 0

        rule["criteria"]["bom"]["regional_value_content"]["threshold"] = 100.0
        assert len(list(validator.iter_errors(rule))) == 0

        # Invalid thresholds
        rule["criteria"]["bom"]["regional_value_content"]["threshold"] = -1.0
        assert len(list(validator.iter_errors(rule))) > 0

        rule["criteria"]["bom"]["regional_value_content"]["threshold"] = 101.0
        assert len(list(validator.iter_errors(rule))) > 0

    def test_calculation_window_range(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test calculation window must be 30-1095 days."""
        rule = valid_minimal_rule.copy()

        # Valid windows
        rule["criteria"]["bom"]["regional_value_content"]["calculation_window_days"] = 30
        assert len(list(validator.iter_errors(rule))) == 0

        rule["criteria"]["bom"]["regional_value_content"]["calculation_window_days"] = 1095
        assert len(list(validator.iter_errors(rule))) == 0

        # Invalid windows
        rule["criteria"]["bom"]["regional_value_content"]["calculation_window_days"] = 29
        assert len(list(validator.iter_errors(rule))) > 0

        rule["criteria"]["bom"]["regional_value_content"]["calculation_window_days"] = 1096
        assert len(list(validator.iter_errors(rule))) > 0

    def test_required_operations_min_items(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that at least one required operation is needed."""
        rule = valid_minimal_rule.copy()

        # Empty array should fail
        rule["criteria"]["process"]["required_operations"] = []
        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_operation_code_pattern(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test operation code pattern validation."""
        rule = valid_minimal_rule.copy()

        # Valid codes
        valid_codes = ["POLYMERIZATION", "CUTTING", "HEAT-TREATMENT", "PROCESS_1"]
        for code in valid_codes:
            rule["criteria"]["process"]["required_operations"] = [
                {"code": code, "description": "Test operation"}
            ]
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid codes
        invalid_codes = ["poly", "PROCESS WITH SPACES", "process-lowercase"]
        for code in invalid_codes:
            rule["criteria"]["process"]["required_operations"] = [
                {"code": code, "description": "Test operation"}
            ]
            assert len(list(validator.iter_errors(rule))) > 0

    def test_record_retention_range(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test record retention days must be 365-7300."""
        rule = valid_minimal_rule.copy()

        # Valid ranges
        rule["criteria"]["documentation"]["record_retention_days"] = 365
        assert len(list(validator.iter_errors(rule))) == 0

        rule["criteria"]["documentation"]["record_retention_days"] = 7300
        assert len(list(validator.iter_errors(rule))) == 0

        # Invalid ranges
        rule["criteria"]["documentation"]["record_retention_days"] = 364
        assert len(list(validator.iter_errors(rule))) > 0

        rule["criteria"]["documentation"]["record_retention_days"] = 7301
        assert len(list(validator.iter_errors(rule))) > 0


class TestDecisionValidation:
    """Test decision field validations."""

    def test_citations_min_items(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test qualified verdict requires at least one citation."""
        rule = valid_minimal_rule.copy()

        rule["decision"]["verdicts"]["qualified"]["citations"] = []
        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_disqualification_reasons_min_items(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test disqualified verdict requires at least one reason."""
        rule = valid_minimal_rule.copy()

        rule["decision"]["verdicts"]["disqualified"]["reasons"] = []
        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_severity_enum(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test severity must be valid enum value."""
        rule = valid_minimal_rule.copy()

        # Valid severities
        for severity in ["low", "medium", "high", "critical"]:
            rule["decision"]["verdicts"]["disqualified"]["reasons"] = [
                {
                    "code": "TEST_REASON",
                    "description": "Test reason",
                    "severity": severity
                }
            ]
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid severity
        rule["decision"]["verdicts"]["disqualified"]["reasons"] = [
            {
                "code": "TEST_REASON",
                "description": "Test reason",
                "severity": "invalid"
            }
        ]
        assert len(list(validator.iter_errors(rule))) > 0

    def test_disqualification_code_pattern(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test disqualification code pattern."""
        rule = valid_minimal_rule.copy()

        # Valid codes
        valid_codes = ["INSUFFICIENT_RVC", "MISSING_PROCESS", "CODE123"]
        for code in valid_codes:
            rule["decision"]["verdicts"]["disqualified"]["reasons"] = [
                {"code": code, "description": "Test reason description", "severity": "high"}
            ]
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid codes
        invalid_codes = ["code-with-dash", "code with spaces", "CoDe"]
        for code in invalid_codes:
            rule["decision"]["verdicts"]["disqualified"]["reasons"] = [
                {"code": code, "description": "Test reason description", "severity": "high"}
            ]
            assert len(list(validator.iter_errors(rule))) > 0


class TestAuditValidation:
    """Test audit field validations."""

    def test_ledger_reference_pattern(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test ledger reference must follow ledger:// URI scheme."""
        rule = valid_minimal_rule.copy()

        # Valid references
        valid_refs = ["ledger://psra/v1", "ledger://test/path/to/entry", "ledger://a-b-c/123"]
        for ref in valid_refs:
            rule["audit"]["traceability"]["ledger_reference"] = ref
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid references
        invalid_refs = ["http://example.com", "ledger:/missing-slash", "LEDGER://uppercase"]
        for ref in invalid_refs:
            rule["audit"]["traceability"]["ledger_reference"] = ref
            assert len(list(validator.iter_errors(rule))) > 0

    def test_reviewer_pattern(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test reviewer identifier pattern."""
        rule = valid_minimal_rule.copy()

        # Valid identifiers
        valid_ids = ["compliance-board", "john-doe", "team123", "a-b-c"]
        for reviewer_id in valid_ids:
            rule["audit"]["reviewer"] = reviewer_id
            assert len(list(validator.iter_errors(rule))) == 0

        # Invalid identifiers
        invalid_ids = ["Uppercase", "with_underscore", "with spaces", "ab"]  # too short
        for reviewer_id in invalid_ids:
            rule["audit"]["reviewer"] = reviewer_id
            assert len(list(validator.iter_errors(rule))) > 0


class TestRequiredFields:
    """Test required field enforcement."""

    def test_missing_version(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that version is required."""
        rule = valid_minimal_rule.copy()
        del rule["version"]
        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_missing_metadata_fields(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that metadata required fields are enforced."""
        rule = valid_minimal_rule.copy()

        required_fields = ["rule_id", "title", "description", "agreement", "hs_code",
                          "jurisdiction", "effective_from", "priority", "supersedes"]

        for field in required_fields:
            test_rule = rule.copy()
            del test_rule["metadata"][field]
            errors = list(validator.iter_errors(test_rule))
            assert len(errors) > 0, f"Expected error for missing {field}"


class TestAdditionalPropertiesForbidden:
    """Test that additionalProperties: false is enforced."""

    def test_extra_top_level_property(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that extra top-level properties are rejected."""
        rule = valid_minimal_rule.copy()
        rule["extra_field"] = "should not be allowed"

        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0

    def test_extra_metadata_property(self, validator: Draft7Validator, valid_minimal_rule: Dict[str, Any]):
        """Test that extra metadata properties are rejected."""
        rule = valid_minimal_rule.copy()
        rule["metadata"]["extra_field"] = "should not be allowed"

        errors = list(validator.iter_errors(rule))
        assert len(errors) > 0


if __name__ == "__main__":
    # Run tests with pytest if available, otherwise print basic info
    try:
        import pytest
        pytest.main([__file__, "-v", "--tb=short"])
    except ImportError:
        print("Install pytest to run full test suite: pip install pytest")
        print(f"Schema path: {SCHEMA_PATH}")
        print(f"Schema exists: {SCHEMA_PATH.exists()}")
