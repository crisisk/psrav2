from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from enum import Enum

app = FastAPI()

class Agreement(str, Enum):
    CETA = "CETA"
    TCA = "TCA"
    EPA = "EPA"

class PSRRequirements(BaseModel):
    rvc_threshold: Optional[float]
    ctc_rules: Optional[List[str]]
    other_conditions: Optional[List[str]]

class Rule(BaseModel):
    hs_code: str
    agreement: Agreement
    psr_requirements: PSRRequirements

class RulesResponse(BaseModel):
    agreement: Agreement
    rules: List[Rule]

# Mock data for demonstration
MOCK_RULES = [
    Rule(
        hs_code="123456",
        agreement=Agreement.CETA,
        psr_requirements=PSRRequirements(rvc_threshold=40.0, ctc_rules=["Rule 1"], other_conditions=["Condition A"])
    ),
    Rule(
        hs_code="123456",
        agreement=Agreement.TCA,
        psr_requirements=PSRRequirements(rvc_threshold=50.0, ctc_rules=["Rule 2"], other_conditions=["Condition B"])
    ),
    Rule(
        hs_code="123456",
        agreement=Agreement.EPA,
        psr_requirements=PSRRequirements(rvc_threshold=60.0, ctc_rules=["Rule 3"], other_conditions=["Condition C"])
    ),
    Rule(
        hs_code="123457",
        agreement=Agreement.CETA,
        psr_requirements=PSRRequirements(rvc_threshold=45.0, ctc_rules=["Rule 4"], other_conditions=["Condition D"])
    ),
]

@app.get("/rules/by-hs-code/{code}", response_model=List[RulesResponse])
def get_rules_by_hs_code(code: str):
    """
    Retrieve rules for a specific HS code, supporting partial matching (prefix).
    Rules are grouped by agreement and sorted by most commonly used agreements first.
    """
    # Filter rules by HS code prefix
    filtered_rules = [rule for rule in MOCK_RULES if rule.hs_code.startswith(code)]
    
    if not filtered_rules:
        raise HTTPException(status_code=404, detail="No rules found for the given HS code")
    
    # Group rules by agreement
    grouped_rules: Dict[Agreement, List[Rule]] = {}
    for rule in filtered_rules:
        if rule.agreement not in grouped_rules:
            grouped_rules[rule.agreement] = []
        grouped_rules[rule.agreement].append(rule)
    
    # Sort agreements by priority: CETA, TCA, EPA
    sorted_agreements = sorted(grouped_rules.keys(), key=lambda x: [Agreement.CETA, Agreement.TCA, Agreement.EPA].index(x))
    
    # Prepare response
    response = [RulesResponse(agreement=agreement, rules=rules) for agreement, rules in grouped_rules.items()]
    response.sort(key=lambda x: sorted_agreements.index(x.agreement))
    
    return response
