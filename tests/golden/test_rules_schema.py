from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

from psr.validator import validate_directory, validate_rule_text

SCHEMA_PATH = Path("psr/schema/psr_rule.schema.v2.json").resolve()
RULES_DIR = Path("psr/rules").resolve()


@pytest.fixture(scope="module")
def validation_results() -> dict[Path, list[str]]:
    errors = validate_directory(SCHEMA_PATH, RULES_DIR)
    return {Path(path): errs for path, errs in errors}


@pytest.mark.parametrize("rule_file", sorted(RULES_DIR.rglob("*.yaml")))
def test_rule_files_conform_to_schema(rule_file: Path, validation_results: dict[Path, list[str]]) -> None:
    assert rule_file in validation_results, f"{rule_file} missing from validator results"
    assert (
        validation_results[rule_file] == []
    ), f"{rule_file} failed validation: {validation_results[rule_file]}"


def test_invalid_payload_fails_validation() -> None:
    invalid_yaml = """
version: "2.0.0"
metadata:
  rule_id: "BAD-ID"
  title: "Invalid rule"
  description: "Short"
  agreement:
    code: "CETA"
    name: "Comprehensive Economic and Trade Agreement"
  hs_code:
    chapter: "39"
    heading: "3901"
    subheading: "390110"
  jurisdiction: []
  effective_from: "2024-01-01"
  priority: 0
  supersedes: []
criteria:
  bom:
    required_inputs: []
    regional_value_content:
      method: "build-up"
      threshold: 60
      calculation_window_days: 365
  process:
    required_operations: []
    disallowed_operations: []
  documentation:
    certificates: []
    record_retention_days: 30
decision:
  verdicts:
    qualified:
      description: ""
      citations: []
    disqualified:
      reasons: []
audit:
  traceability:
    lineage_required: false
    ledger_reference: "ledger://"
  last_reviewed: "2024-01-01"
  reviewer: "bad"
"""
    errors = validate_rule_text(SCHEMA_PATH, invalid_yaml)
    assert errors, "Invalid payload should yield validation errors"


def test_cli_runner_reports_success(tmp_path: Path) -> None:
    output_dir = tmp_path / "rules"
    output_dir.mkdir()
    sample_rule = RULES_DIR / "hs39" / "ceta_polymer_rule.yaml"
    target = output_dir / sample_rule.name
    target.write_text(sample_rule.read_text(encoding="utf-8"), encoding="utf-8")

    result = subprocess.run(
        [
            "python",
            "-m",
            "psr.loader.psr_loader",
            "--schema",
            str(SCHEMA_PATH),
            "--rules-dir",
            str(output_dir),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "[SUCCESS]" in result.stdout
