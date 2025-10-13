"""Load Rules-as-Code YAML files into Postgres with data quality enforcement."""

from __future__ import annotations

import argparse
import logging
from pathlib import Path
import sys
from typing import Iterable, List

import pandas as pd
import yaml
from great_expectations.dataset import PandasDataset

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.contracts.psra import PSRARule
from backend.app.dal.postgres_dal import PostgresDAL
from backend.app.db.base import Base
from backend.app.db.session import build_engine, create_session_factory
from psr.loader.psr_loader import DEFAULT_RULES_DIR, DEFAULT_SCHEMA, run_validation

LOGGER = logging.getLogger("psra.etl.ingest")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rules-dir", type=Path, default=DEFAULT_RULES_DIR)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--dsn", type=str, default=None)
    parser.add_argument("--validate", action="store_true", help="Run validation checks before load")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Run validations and skip database load",
    )
    parser.add_argument("--log-level", type=str, default="INFO")
    return parser.parse_args()


def discover_rule_files(rules_dir: Path) -> List[Path]:
    return sorted(rules_dir.rglob("*.yaml"))


def load_rules(paths: Iterable[Path]) -> List[PSRARule]:
    rules: List[PSRARule] = []
    for path in paths:
        with path.open("r", encoding="utf-8") as handle:
            payload = yaml.safe_load(handle)
        rules.append(PSRARule.model_validate(payload))
    if not rules:
        raise ValueError("No rule files discovered; cannot run ETL")
    return rules


def run_schema_validation(schema: Path, rules_dir: Path) -> None:
    results = run_validation(schema, rules_dir)
    failures = {path: errors for path, errors in results if errors}
    if failures:
        for path, errors in failures.items():
            for error in errors:
                LOGGER.error("Schema validation failed for %s: %s", path, error)
        raise ValueError(f"{len(failures)} rule file(s) failed schema validation")


def run_expectations(rules: List[PSRARule]) -> None:
    frame = pd.DataFrame(
        [
            {
                "rule_id": rule.metadata.rule_id,
                "agreement_code": rule.metadata.agreement.code,
                "hs_subheading": rule.metadata.hs_code.subheading,
                "priority": rule.metadata.priority,
                "jurisdiction_count": len(rule.metadata.jurisdiction),
                "has_disqualifiers": bool(rule.decision.disqualified.reasons),
            }
            for rule in rules
        ]
    )
    dataset = PandasDataset(frame)
    checks = [
        dataset.expect_column_values_to_not_be_null("rule_id"),
        dataset.expect_column_values_to_be_unique("rule_id"),
        dataset.expect_column_values_to_not_be_null("agreement_code"),
        dataset.expect_column_values_to_match_regex("hs_subheading", r"^[0-9]{6}$"),
        dataset.expect_column_values_to_be_between("priority", min_value=0, max_value=999),
        dataset.expect_column_values_to_be_between("jurisdiction_count", min_value=1, max_value=10),
    ]
    if not all(check["success"] for check in checks):
        raise ValueError("Great Expectations validation failed for rule dataset")


def main() -> int:
    args = parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level.upper(), logging.INFO))

    if args.validate or args.validate_only:
        LOGGER.info("Running schema validation against %s", args.schema)
        run_schema_validation(args.schema, args.rules_dir)

    rule_files = discover_rule_files(args.rules_dir)
    LOGGER.info("Discovered %d rule file(s)", len(rule_files))
    rules = load_rules(rule_files)

    LOGGER.info("Running Great Expectations data quality suite")
    run_expectations(rules)

    if args.validate_only:
        LOGGER.info("Validation-only mode enabled; skipping database load")
        return 0

    engine = build_engine(args.dsn)
    Base.metadata.create_all(engine)
    dal = PostgresDAL(create_session_factory(engine))
    LOGGER.info("Loading %d rule(s) into Postgres", len(rules))
    dal.upsert_rules(rules)
    LOGGER.info("Rules ingestion completed successfully")
    return 0


if __name__ == "__main__":  # pragma: no cover - script entry point
    raise SystemExit(main())
