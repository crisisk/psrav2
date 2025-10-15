from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import httpx
from datetime import datetime
import logging
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class TextInput(BaseModel):
    """Single text input for NER processing"""
    text: str = Field(..., min_length=1, max_length=10000, description="Text to analyze")
    id: Optional[str] = Field(None, description="Optional identifier for the text")

class Entity(BaseModel):
    """Recognized entity details"""
    text: str = Field(..., description="Extracted entity text")
    type: str = Field(..., description="Entity type (product, hs_code, country, company, value)")
    start: int = Field(..., description="Start position in original text")
    end: int = Field(..., description="End position in original text")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")

class TextResult(BaseModel):
    """NER results for a single text"""
    text: str = Field(..., description="Original text")
    id: Optional[str] = Field(None, description="Optional identifier for the text")
    entities: List[Entity] = Field(default_factory=list, description="List of recognized entities")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")

class NERRequest(BaseModel):
    """Batch NER request"""
    texts: List[TextInput] = Field(..., description="List of texts to analyze")
    
    @validator('texts')
    def validate_texts(cls, v):
        if len(v) > 10:
            raise ValueError("Maximum 10 texts allowed per request")
        return v

class NERResponse(BaseModel):
    """Batch NER response"""
    results: List[TextResult] = Field(..., description="List of text analysis results")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

async def call_psra_ner_service(text: str) -> List[Entity]:
    """Call the psra-ner ML service to extract entities"""
    try:
        async with httpx.AsyncClient(timeout=settings.NER_SERVICE_TIMEOUT) as client:
            response = await client.post(
                settings.NER_SERVICE_URL,
                json={"text": text},
                headers={"Authorization": f"Bearer {settings.NER_SERVICE_API_KEY}"}
            )
            response.raise_for_status()
            
            # Transform the service response to our Entity model
            raw_entities = response.json().get("entities", [])
            return [
                Entity(
                    text=e["text"],
                    type=e["type"],
                    start=e["start"],
                    end=e["end"],
                    confidence=e["confidence"]
                )
                for e in raw_entities
            ]
    except httpx.HTTPStatusError as e:
        logger.error(f"NER service returned error: {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NER service returned an error"
        )
    except httpx.RequestError as e:
        logger.error(f"Failed to connect to NER service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NER service unavailable"
        )

@router.post("/extract-entities", response_model=NERResponse)
async def extract_entities(request: NERRequest):
    """
    Extract named entities from text(s) using ML.
    
    Supported entity types:
    - product: Product names or descriptions
    - hs_code: HS/Harmonized System codes
    - country: Country names or codes
    - company: Company or organization names
    - value: Monetary values or prices
    
    Accepts up to 10 texts per request.
    """
    results = []
    
    for text_input in request.texts:
        start_time = datetime.utcnow()
        
        try:
            entities = await call_psra_ner_service(text_input.text)
            end_time = datetime.utcnow()
            
            results.append(TextResult(
                text=text_input.text,
                id=text_input.id,
                entities=entities,
                processing_time_ms=(end_time - start_time).total_seconds() * 1000
            ))
        except Exception as e:
            logger.error(f"Error processing text {text_input.id}: {str(e)}")
            # Include failed items with empty entities
            end_time = datetime.utcnow()
            results.append(TextResult(
                text=text_input.text,
                id=text_input.id,
                entities=[],
                processing_time_ms=(end_time - start_time).total_seconds() * 1000
            ))
    
    return NERResponse(results=results)