from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Pydantic models for request and response
class RuleSuggestionRequest(BaseModel):
    productDescription: str
    origin: str
    destination: str

class RuleSuggestion(BaseModel):
    ruleId: str
    description: str
    confidenceScore: float

class RuleSuggestionResponse(BaseModel):
    hsCode: str
    suggestions: List[RuleSuggestion]

# ML Service URL (can be moved to config)
ML_SERVICE_URL = "http://ml-service:5000/predict"

# Fallback keyword matching (simple example)
FALLBACK_KEYWORDS = {
    "electronics": "8543",
    "clothing": "6205",
    "food": "1905",
}

def predict_hs_code_ml(product_description: str) -> Optional[str]:
    """Predict HS code using ML service."""
    try:
        response = requests.post(
            ML_SERVICE_URL,
            json={"text": product_description},
            timeout=5
        )
        response.raise_for_status()
        return response.json().get("hsCode")
    except Exception as e:
        logger.error(f"ML service error: {e}")
        return None

def fallback_hs_code(product_description: str) -> str:
    """Fallback to keyword matching if ML service is unavailable."""
    for keyword, hs_code in FALLBACK_KEYWORDS.items():
        if keyword in product_description.lower():
            return hs_code
    return "9999"  # Default HS code if no match found

def get_rules_for_hs_code(hs_code: str) -> List[RuleSuggestion]:
    """Query rules for a given HS code (mock implementation)."""
    # In a real implementation, this would query a database
    mock_rules = {
        "8543": [
            {"ruleId": "R1", "description": "Electronics Import Rule", "confidenceScore": 0.95},
            {"ruleId": "R2", "description": "Safety Certification", "confidenceScore": 0.90},
        ],
        "6205": [
            {"ruleId": "R3", "description": "Textile Import Rule", "confidenceScore": 0.85},
        ],
        "1905": [
            {"ruleId": "R4", "description": "Food Safety Regulation", "confidenceScore": 0.92},
        ],
        "9999": [
            {"ruleId": "R5", "description": "General Import Rule", "confidenceScore": 0.80},
        ],
    }
    return mock_rules.get(hs_code, [])

@app.post("/rules/suggest", response_model=RuleSuggestionResponse)
async def suggest_rules(request: RuleSuggestionRequest):
    """Suggest applicable rules based on product description."""
    # Predict HS code using ML service
    hs_code = predict_hs_code_ml(request.productDescription)
    
    # Fallback to keyword matching if ML service fails
    if not hs_code:
        hs_code = fallback_hs_code(request.productDescription)
        logger.info(f"Using fallback HS code: {hs_code}")
    
    # Get rules for the predicted HS code
    suggestions = get_rules_for_hs_code(hs_code)
    
    return RuleSuggestionResponse(hsCode=hs_code, suggestions=suggestions)

# Error handling middleware
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unexpected error: {exc}")
    return HTTPException(status_code=500, detail="Internal Server Error")
