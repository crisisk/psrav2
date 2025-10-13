from typing import List, Optional
from datetime import datetime
import uuid
import logging

from app.models.version_ledger import OriginDecision, RuleVersion, OriginDecisionBase, RuleVersionBase

logger = logging.getLogger(__name__)

# Mock in-memory storage for the Version Ledger
MOCK_RULE_VERSIONS: List[RuleVersion] = []
MOCK_ORIGIN_DECISIONS: List[OriginDecision] = []

# Initialize with a mock rule version
MOCK_RULE_VERSIONS.append(RuleVersion(
    version_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
    rule_set_name="PEM 2023",
    effective_date=datetime(2023, 1, 1),
    rules_content={"rule_4": "Change of Tariff Heading"},
    checksum="mock_checksum_1",
    created_by="System"
))

class VersionLedgerService:
    """
    Mock service for interacting with the immutable Version Ledger.
    In a real system, this would interface with a PostgreSQL/Time-Series DB.
    """
    
    def get_active_rule_version(self) -> RuleVersion:
        """Retrieves the currently active rule version."""
        # Mock: always return the first mock version
        return MOCK_RULE_VERSIONS[0]

    def log_origin_decision(self, decision_data: OriginDecisionBase) -> OriginDecision:
        """Logs an immutable origin decision to the ledger."""
        new_decision = OriginDecision(**decision_data.dict())
        MOCK_ORIGIN_DECISIONS.append(new_decision)
        logger.info(f"Logged new decision: {new_decision.decision_id}")
        return new_decision

    def get_decision_by_id(self, decision_id: uuid.UUID) -> Optional[OriginDecision]:
        """Retrieves a decision from the ledger."""
        for decision in MOCK_ORIGIN_DECISIONS:
            if decision.decision_id == decision_id:
                return decision
        return None

    def update_hitl_log(self, decision_id: uuid.UUID, hitl_log: dict) -> Optional[OriginDecision]:
        """
        Updates the HITL log for a decision. 
        NOTE: In a true immutable ledger, this would log a *new* event 
        referencing the original decision, but for this mockup, we update the 
        in-memory object for simplicity.
        """
        for decision in MOCK_ORIGIN_DECISIONS:
            if decision.decision_id == decision_id:
                decision.hitl_log = hitl_log
                decision.escalation_status = hitl_log.get("correction_type", "HITL_UPDATED")
                logger.info(f"Updated HITL log for decision: {decision_id}")
                return decision
        return None

# Singleton instance
version_ledger_service = VersionLedgerService()

