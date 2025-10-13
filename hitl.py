from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
import logging
import uuid

from app.services.version_ledger_service import version_ledger_service
from app.models.version_ledger import HITLLog

router = APIRouter()
logger = logging.getLogger(__name__)

class HITLFeedback(BaseModel):
    decision_id: uuid.UUID
    user_id: str
    correction_type: str # e.g., "APPROVED", "OVERRULED", "CORRECTED"
    corrected_origin: str = None
    corrected_citation: str = None
    reason: str
    
    class Config:
        schema_extra = {
            "example": {
                "decision_id": "00000000-0000-0000-0000-000000000000", # Placeholder UUID
                "user_id": "psra_manager_123",
                "correction_type": "OVERRULED",
                "corrected_origin": "Non-Preferential",
                "corrected_citation": "UCC Annex 22-18, Para 1",
                "reason": "AI failed to account for non-originating material exceeding 50% threshold."
            }
        }

@router.post("/hitl/feedback", response_model=dict, status_code=200)
def submit_hitl_feedback(feedback: HITLFeedback) -> Any:
    """
    Endpoint for the Reinforcement Learning - Human-in-the-Loop (RL-HITL) feedback loop.
    
    This captures human corrections and uses them to refine the Judge-Model.
    """
    try:
        hitl_log = HITLLog(
            user_id=feedback.user_id,
            correction_type=feedback.correction_type,
            corrected_origin=feedback.corrected_origin,
            corrected_citation=feedback.corrected_citation,
            reason=feedback.reason
        )
        
        updated_decision = version_ledger_service.update_hitl_log(
            decision_id=feedback.decision_id,
            hitl_log=hitl_log.dict()
        )
        
        if not updated_decision:
            raise HTTPException(status_code=404, detail=f"Decision ID {feedback.decision_id} not found.")
            
        # In a real system, this would also queue a task for the RL-HITL training pipeline
        
        return {"message": "HITL feedback successfully submitted and logged to Version Ledger.", "decision_id": str(feedback.decision_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting HITL feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@router.get("/hitl/review/{decision_id}", response_model=dict)
def get_decision_for_review(decision_id: uuid.UUID) -> Any:
    """
    Retrieves a low-confidence decision from the Version Ledger for human review.
    """
    decision = version_ledger_service.get_decision_by_id(decision_id)
    
    if decision:
        # Return a simplified view for the reviewer
        return {
            "decision_id": str(decision.decision_id),
            "tenant_id": str(decision.tenant_id),
            "ai_origin": decision.output_origin,
            "ai_confidence": decision.confidence_score,
            "ai_citation": decision.rule_citation,
            "input_data": decision.input_data,
            "status": decision.escalation_status
        }
    else:
        raise HTTPException(status_code=404, detail="Decision not found or already reviewed.")

