from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
import uuid

# --- RuleVersion Model (Immutable Rule Set) ---

class RuleVersionBase(BaseModel):
    rule_set_name: str = Field(..., description="e.g., 'PEM 2023', 'UCC Annex 22-15'")
    effective_date: datetime = Field(..., description="Date/time when this rule set became active.")
    deactivation_date: Optional[datetime] = Field(None, description="Date/time when this rule set was replaced (NULL if active).")
    rules_content: Dict[str, Any] = Field(..., description="The full content of the rule set (e.g., a list of rules and their logic).")
    checksum: str = Field(..., description="SHA256 hash of the rules_content for integrity.")
    created_by: str = Field(..., description="User or system that uploaded the rule set.")

class RuleVersion(RuleVersionBase):
    version_id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique identifier for this rule set version.")

    class Config:
        orm_mode = True

# --- OriginDecision Model (Immutable Decision Log) ---

class HITLLog(BaseModel):
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correction_type: str
    corrected_origin: Optional[str] = None
    corrected_citation: Optional[str] = None
    reason: str

class OriginDecisionBase(BaseModel):
    tenant_id: uuid.UUID = Field(..., description="Identifier for the multi-tenant client.")
    input_data: Dict[str, Any] = Field(..., description="The raw input data (product, materials, etc.) used for the calculation.")
    output_origin: str = Field(..., description="The final determined origin (e.g., 'EU Preferential').")
    confidence_score: float = Field(..., description="The confidence score from the Judge-Model.")
    rule_citation: str = Field(..., description="The specific rule passage cited for Explainability.")
    rule_version_id: uuid.UUID = Field(..., description="Foreign Key linking to the exact RuleVersion used.")
    llm_trace: Dict[str, Any] = Field(..., description="Full trace of the Multi-LLM Consensus Core.")
    is_cached: bool = Field(..., description="True if the decision was made via the Gating/Caching mechanism.")
    escalation_status: str = Field(..., description="e.g., 'NONE', 'PENDING_HITL', 'HITL_APPROVED', 'HITL_OVERRULED'")
    hitl_log: Optional[HITLLog] = Field(None, description="Log of human intervention.")

class OriginDecision(OriginDecisionBase):
    decision_id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique identifier for the decision.")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of the calculation.")

    class Config:
        orm_mode = True

