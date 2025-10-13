from __future__ import annotations

from pathlib import Path

import shutil

import pytest
from testcontainers.postgres import PostgresContainer

from backend.app.db.base import Base
from backend.app.db.session import build_engine, create_session_factory
from backend.app.dal.postgres_dal import PostgresDAL
from backend.app.etl import ingest_rules

FIXTURE_DIR = Path(__file__).resolve().parents[3] / "psr" / "rules"


@pytest.mark.skipif(shutil.which("docker") is None, reason="Docker is required for testcontainers")
def test_ingest_rules_pipeline(tmp_path) -> None:
    with PostgresContainer("postgres:15-alpine") as container:
        dsn = container.get_connection_url()
        rule_paths = ingest_rules.discover_rule_files(FIXTURE_DIR)
        rules = ingest_rules.load_rules(rule_paths)

        ingest_rules.run_schema_validation(ingest_rules.DEFAULT_SCHEMA, FIXTURE_DIR)
        ingest_rules.run_expectations(rules)

        engine = build_engine(dsn)
        Base.metadata.create_all(engine)
        dal = PostgresDAL(create_session_factory(engine))
        dal.upsert_rules(rules)

        stored = dal.list_rules()
        assert stored
        assert {rule.metadata.rule_id for rule in stored} == {
            r.metadata.rule_id for r in rules
        }
