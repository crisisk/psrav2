#!/usr/bin/env python3
"""Validation script for PSRA Rules-as-Code JSON Schema.

This script validates YAML rule files against the psr_rule.schema.v2.json schema,
demonstrating comprehensive validation capabilities and providing detailed error reporting.

Usage:
    python3 validate_schema.py                    # Validate all rules in psr/rules/
    python3 validate_schema.py --rule FILE.yaml   # Validate specific rule file
    python3 validate_schema.py --verbose          # Show detailed validation output
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    import yaml
    from jsonschema import Draft7Validator, ValidationError
    from jsonschema.exceptions import best_match
except ImportError:
    print("ERROR: Required packages not installed", file=sys.stderr)
    print("Install with: pip install pyyaml jsonschema", file=sys.stderr)
    sys.exit(2)

# Paths relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SCHEMA_PATH = SCRIPT_DIR / "psr_rule.schema.v2.json"
RULES_DIR = PROJECT_ROOT / "psr" / "rules"


def load_schema(schema_path: Path) -> Dict[str, Any]:
    """Load and parse JSON schema file.

    Args:
        schema_path: Path to JSON schema file

    Returns:
        Parsed schema dictionary

    Raises:
        FileNotFoundError: If schema file doesn't exist
        json.JSONDecodeError: If schema is invalid JSON
    """
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    with schema_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_rule(rule_path: Path) -> Dict[str, Any]:
    """Load and parse YAML rule file.

    Args:
        rule_path: Path to YAML rule file

    Returns:
        Parsed rule dictionary

    Raises:
        FileNotFoundError: If rule file doesn't exist
        yaml.YAMLError: If YAML is malformed
    """
    if not rule_path.exists():
        raise FileNotFoundError(f"Rule file not found: {rule_path}")

    with rule_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def validate_rule(
    rule_data: Dict[str, Any],
    schema: Dict[str, Any],
    verbose: bool = False
) -> Tuple[bool, List[str]]:
    """Validate a rule against the JSON schema.

    Args:
        rule_data: Parsed rule data
        schema: Parsed schema
        verbose: If True, include all validation errors

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    validator = Draft7Validator(schema)
    errors = list(validator.iter_errors(rule_data))

    if not errors:
        return True, []

    if verbose:
        # Return all errors with detailed paths
        error_messages = []
        for error in errors:
            path = ".".join(str(p) for p in error.path) if error.path else "root"
            error_messages.append(f"{path}: {error.message}")
        return False, error_messages
    else:
        # Return only the most relevant error
        best_error = best_match(errors)
        path = ".".join(str(p) for p in best_error.path) if best_error.path else "root"
        return False, [f"{path}: {best_error.message}"]


def discover_rules(rules_dir: Path) -> List[Path]:
    """Discover all YAML rule files in directory tree.

    Args:
        rules_dir: Root directory to search

    Returns:
        Sorted list of YAML file paths
    """
    if not rules_dir.exists():
        return []

    return sorted(rules_dir.rglob("*.yaml")) + sorted(rules_dir.rglob("*.yml"))


def format_validation_result(
    rule_path: Path,
    is_valid: bool,
    errors: List[str],
    verbose: bool = False
) -> str:
    """Format validation result for display.

    Args:
        rule_path: Path to the rule file
        is_valid: Whether validation passed
        errors: List of error messages
        verbose: If True, include extended information

    Returns:
        Formatted string for output
    """
    relative_path = rule_path.relative_to(PROJECT_ROOT) if rule_path.is_relative_to(PROJECT_ROOT) else rule_path

    if is_valid:
        status = "✓ VALID" if sys.stdout.isatty() else "[VALID]"
        return f"{status:10} {relative_path}"
    else:
        status = "✗ INVALID" if sys.stdout.isatty() else "[INVALID]"
        output = f"{status:10} {relative_path}"

        for error in errors:
            output += f"\n           └─ {error}"

        return output


def validate_schema_examples(schema: Dict[str, Any], verbose: bool = False) -> Tuple[int, int]:
    """Validate examples embedded in the schema itself.

    Args:
        schema: Parsed schema with 'examples' key
        verbose: If True, show detailed output

    Returns:
        Tuple of (valid_count, invalid_count)
    """
    if "examples" not in schema:
        return 0, 0

    examples = schema["examples"]
    valid_count = 0
    invalid_count = 0

    print(f"\nValidating {len(examples)} embedded schema example(s)...\n")

    for idx, example in enumerate(examples, 1):
        rule_id = example.get("metadata", {}).get("rule_id", f"Example {idx}")
        is_valid, errors = validate_rule(example, schema, verbose)

        if is_valid:
            print(f"✓ Example {idx} ({rule_id}): VALID" if sys.stdout.isatty() else f"[VALID] Example {idx} ({rule_id})")
            valid_count += 1
        else:
            print(f"✗ Example {idx} ({rule_id}): INVALID" if sys.stdout.isatty() else f"[INVALID] Example {idx} ({rule_id})")
            for error in errors:
                print(f"  └─ {error}")
            invalid_count += 1

    return valid_count, invalid_count


def main() -> int:
    """Main entry point for validation script.

    Returns:
        Exit code: 0 for success, 1 for validation failures, 2 for errors
    """
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--rule",
        type=Path,
        help="Validate a specific rule file (default: validate all in psr/rules/)"
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=SCHEMA_PATH,
        help=f"Path to JSON schema (default: {SCHEMA_PATH})"
    )
    parser.add_argument(
        "--rules-dir",
        type=Path,
        default=RULES_DIR,
        help=f"Directory containing rules (default: {RULES_DIR})"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed validation errors"
    )
    parser.add_argument(
        "--validate-examples",
        action="store_true",
        help="Validate examples embedded in schema"
    )

    args = parser.parse_args()

    # Load schema
    try:
        schema = load_schema(args.schema)
        print(f"Loaded schema: {args.schema.relative_to(PROJECT_ROOT) if args.schema.is_relative_to(PROJECT_ROOT) else args.schema}")
        print(f"Schema version: {schema.get('$id', 'Unknown')}")
        print(f"Schema title: {schema.get('title', 'Unknown')}\n")
    except Exception as e:
        print(f"ERROR: Failed to load schema: {e}", file=sys.stderr)
        return 2

    # Validate schema examples if requested
    if args.validate_examples:
        example_valid, example_invalid = validate_schema_examples(schema, args.verbose)
        if example_invalid > 0:
            print(f"\nSchema examples validation: {example_invalid} FAILED", file=sys.stderr)
            return 1
        print(f"\nSchema examples validation: {example_valid} PASSED\n")
        return 0

    # Determine which rules to validate
    if args.rule:
        rule_files = [args.rule]
    else:
        rule_files = discover_rules(args.rules_dir)
        if not rule_files:
            print(f"No rule files found in {args.rules_dir}", file=sys.stderr)
            return 2

    print(f"Validating {len(rule_files)} rule file(s)...\n")

    # Validate each rule
    valid_count = 0
    invalid_count = 0
    error_count = 0

    for rule_path in rule_files:
        try:
            rule_data = load_rule(rule_path)
            is_valid, errors = validate_rule(rule_data, schema, args.verbose)

            print(format_validation_result(rule_path, is_valid, errors, args.verbose))

            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1

        except Exception as e:
            relative_path = rule_path.relative_to(PROJECT_ROOT) if rule_path.is_relative_to(PROJECT_ROOT) else rule_path
            print(f"✗ ERROR    {relative_path}")
            print(f"           └─ {type(e).__name__}: {e}")
            error_count += 1

    # Print summary
    print(f"\n{'='*60}")
    print(f"Validation Summary:")
    print(f"  Valid:   {valid_count:3}")
    print(f"  Invalid: {invalid_count:3}")
    print(f"  Errors:  {error_count:3}")
    print(f"  Total:   {len(rule_files):3}")
    print(f"{'='*60}")

    if invalid_count > 0 or error_count > 0:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
