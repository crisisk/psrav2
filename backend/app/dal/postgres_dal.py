"""Postgres Data Access Layer for PSRA canonical storage."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from typing import Iterable, List, Optional

from sqlalchemy import Select, and_, or_, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session, sessionmaker

from backend.app.contracts.psra import EvaluationOutput, PSRARule
from backend.app.dal.models import RuleRecord, VerdictRecord
from backend.app.db.session import session_scope


class PostgresDAL:
    """Repository facade for interacting with PSRA canonical tables."""

    def __init__(self, session_factory: sessionmaker[Session]):
        self._session_factory = session_factory

    # ------------------------------------------------------------------
    # Rules
    # ------------------------------------------------------------------
    def upsert_rules(self, rules: Iterable[PSRARule]) -> None:
        """Insert or update a collection of rules."""

        with session_scope(self._session_factory) as session:
            for rule in rules:
                self._upsert_rule(session, rule)

    def _upsert_rule(self, session: Session, rule: PSRARule) -> None:
        payload = rule.model_dump(mode="json")
        existing = session.scalar(
            select(RuleRecord).where(RuleRecord.rule_id == rule.metadata.rule_id)
        )
        metadata = rule.metadata
        if existing:
            existing.version = rule.version
            existing.agreement_code = metadata.agreement.code
            existing.agreement_name = metadata.agreement.name
            existing.hs_chapter = metadata.hs_code.chapter
            existing.hs_heading = metadata.hs_code.heading
            existing.hs_subheading = metadata.hs_code.subheading
            existing.jurisdictions = metadata.jurisdiction
            existing.effective_from = metadata.effective_from
            existing.effective_to = metadata.effective_to
            existing.priority = metadata.priority
            existing.supersedes = metadata.supersedes
            existing.payload = payload
        else:
            session.add(
                RuleRecord(
                    rule_id=metadata.rule_id,
                    version=rule.version,
                    agreement_code=metadata.agreement.code,
                    agreement_name=metadata.agreement.name,
                    hs_chapter=metadata.hs_code.chapter,
                    hs_heading=metadata.hs_code.heading,
                    hs_subheading=metadata.hs_code.subheading,
                    jurisdictions=metadata.jurisdiction,
                    effective_from=metadata.effective_from,
                    effective_to=metadata.effective_to,
                    priority=metadata.priority,
                    supersedes=metadata.supersedes,
                    payload=payload,
                ),
            )

    def get_rule(self, rule_id: str) -> PSRARule:
        with session_scope(self._session_factory) as session:
            record = session.scalar(select(RuleRecord).where(RuleRecord.rule_id == rule_id))
            if not record:
                raise NoResultFound(rule_id)
            return self._record_to_rule(record)

    def list_rules(
        self,
        *,
        agreement_code: Optional[str] = None,
        hs_subheading: Optional[str] = None,
        effective_on: Optional[date] = None,
    ) -> List[PSRARule]:
        with session_scope(self._session_factory) as session:
            stmt: Select[RuleRecord] = select(RuleRecord)
            if agreement_code:
                stmt = stmt.where(RuleRecord.agreement_code == agreement_code)
            if hs_subheading:
                stmt = stmt.where(RuleRecord.hs_subheading == hs_subheading)
            if effective_on:
                stmt = stmt.where(
                    and_(
                        RuleRecord.effective_from <= effective_on,
                        or_(
                            RuleRecord.effective_to.is_(None),
                            RuleRecord.effective_to >= effective_on,
                        ),
                    )
                )
            stmt = stmt.order_by(RuleRecord.priority.asc(), RuleRecord.rule_id.asc())
            records = session.scalars(stmt).all()
            return [self._record_to_rule(rec) for rec in records]

    # ------------------------------------------------------------------
    # Verdicts
    # ------------------------------------------------------------------
    def persist_verdict(self, evaluation: EvaluationOutput) -> None:
        verdict = evaluation.verdict
        metadata = evaluation.input.context
        traceability = evaluation.rule.audit.traceability
        input_hash = hashlib.sha256(
            json.dumps(evaluation.input.model_dump(mode="json"), sort_keys=True).encode()
        ).hexdigest()
        with session_scope(self._session_factory) as session:
            record = session.scalar(
                select(VerdictRecord).where(VerdictRecord.evaluation_id == verdict.evaluation_id)
            )
            data = {
                "evaluation_id": verdict.evaluation_id,
                "rule_id": verdict.rule_id,
                "status": verdict.status.value,
                "confidence": verdict.confidence,
                "citations": [c.model_dump(mode="json") for c in verdict.citations],
                "reasons": [r.model_dump(mode="json") for r in verdict.disqualification_reasons],
                "notes": verdict.notes,
                "ledger_reference": verdict.ledger_reference,
                "input_payload": evaluation.input.model_dump(mode="json"),
                "input_hash": input_hash,
                "processing_time_ms": evaluation.metrics.processing_time_ms,
                "rules_evaluated": evaluation.metrics.rules_evaluated,
                "decided_at": verdict.decided_at,
                "tenant_id": metadata.tenant_id,
                "request_id": metadata.request_id,
                "agreement_code": metadata.agreement.code,
                "hs_subheading": metadata.hs_code.subheading,
                "effective_date": metadata.effective_date,
                "import_country": metadata.import_country,
                "export_country": metadata.export_country,
                "lineage_required": traceability.lineage_required,
            }
            if record:
                for key, value in data.items():
                    setattr(record, key, value)
            else:
                session.add(VerdictRecord(**data))

    def fetch_verdict(self, evaluation_id: str) -> EvaluationOutput:
        with session_scope(self._session_factory) as session:
            record = session.scalar(
                select(VerdictRecord).where(VerdictRecord.evaluation_id == evaluation_id)
            )
            if not record:
                raise NoResultFound(evaluation_id)
            rule = self.get_rule(record.rule_id)
            return self._record_to_evaluation_output(record, rule)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _record_to_rule(self, record: RuleRecord) -> PSRARule:
        return PSRARule.model_validate(record.payload)

    def _record_to_evaluation_output(
        self, record: VerdictRecord, rule: PSRARule
    ) -> EvaluationOutput:
        payload = {
            "input": record.input_payload,
            "rule": rule.model_dump(mode="json"),
            "verdict": {
                "evaluation_id": str(record.evaluation_id),
                "rule_id": record.rule_id,
                "status": record.status,
                "decided_at": record.decided_at.isoformat(),
                "confidence": record.confidence,
                "citations": record.citations,
                "disqualification_reasons": record.reasons,
                "notes": record.notes,
                "ledger_reference": record.ledger_reference,
            },
            "metrics": {
                "processing_time_ms": record.processing_time_ms,
                "rules_evaluated": record.rules_evaluated,
            },
            "provenance": {
                "input_hash": record.input_hash,
                "stored_at": record.created_at.isoformat(),
                "lineage_required": record.lineage_required,
            },
        }
        return EvaluationOutput.model_validate(payload)
