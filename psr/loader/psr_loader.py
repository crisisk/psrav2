"""Command-line interface for validating PSRA Rules-as-Code assets."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Iterable, List

from psr.validator import validate_directory

DEFAULT_SCHEMA = Path(__file__).resolve().parent.parent / "schema" / "psr_rule.schema.v2.json"
DEFAULT_RULES_DIR = Path(__file__).resolve().parent.parent / "rules"


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help="Path to the JSON schema file (default: %(default)s)",
    )
    parser.add_argument(
        "--rules-dir",
        type=Path,
        default=DEFAULT_RULES_DIR,
        help="Directory containing YAML rules (default: %(default)s)",
    )
    parser.add_argument(
        "--format",
        choices={"text", "json"},
        default="text",
        help="Output format for validation results",
    )
    parser.add_argument(
        "--fail-on-warning",
        action="store_true",
        help="Exit with non-zero status if any warning-level issues are found",
    )
    parser.add_argument(
        "--allow-empty",
        action="store_true",
        help="Do not fail if the rules directory is empty",
    )
    return parser.parse_args(list(argv))


def run_validation(schema: Path, rules_dir: Path) -> List[tuple[str, List[str]]]:
    if not schema.exists():
        raise FileNotFoundError(f"Schema not found: {schema}")
    if not rules_dir.exists():
        raise FileNotFoundError(f"Rules directory not found: {rules_dir}")
    return validate_directory(schema, rules_dir)


def emit_text(results: List[tuple[str, List[str]]], *, allow_empty: bool) -> int:
    invalid = 0
    yaml_count = 0
    for path, errors in sorted(results):
        yaml_count += 1
        if errors:
            invalid += 1
            print(f"[FAIL] {path}")
            for err in errors:
                print(f"    - {err}")
        else:
            print(f"[OK]   {path}")
    if yaml_count == 0 and not allow_empty:
        print("[ERROR] No YAML files discovered in rules directory", file=sys.stderr)
        return 2
    if invalid:
        print(f"[ERROR] {invalid} rule file(s) failed validation", file=sys.stderr)
        return 1
    print(f"[SUCCESS] Validated {yaml_count} rule file(s)")
    return 0


def emit_json(results: List[tuple[str, List[str]]], *, allow_empty: bool) -> int:
    payload = {"results": [{"path": path, "errors": errors} for path, errors in sorted(results)]}
    print(json.dumps(payload, indent=2))
    if not payload["results"] and not allow_empty:
        print("No YAML files discovered in rules directory", file=sys.stderr)
        return 2
    if any(entry["errors"] for entry in payload["results"]):
        return 1
    return 0


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    results = run_validation(args.schema, args.rules_dir)
    if args.format == "json":
        exit_code = emit_json(results, allow_empty=args.allow_empty)
    else:
        exit_code = emit_text(results, allow_empty=args.allow_empty)
    if args.fail_on_warning and exit_code == 0:
        # Placeholder for future warning handling.
        exit_code = 0
    return exit_code


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main())
