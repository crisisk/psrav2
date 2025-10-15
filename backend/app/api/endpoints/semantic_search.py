from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx

app = FastAPI()

class Rule(BaseModel):
    rule_id: int
    description: str
    hs_codes: List[str]
    similarity_score: float

class SimilarRulesResponse(BaseModel):
    query: str
    similar_rules: List[Rule]

PSRA_EMBED_URL = "http://psra-embed-service/api/embed"
PSRA_RAG_URL = "http://psra-rag-service/api/similarity"

@app.get("/ml/similar-rules", response_model=SimilarRulesResponse)
async def get_similar_rules(query: str):
    """
    Get similar rules based on semantic search.
    
    Args:
        query (str): The query text or rule description to search for.
    
    Returns:
        SimilarRulesResponse: A response containing the query and a list of similar rules with details.
    """
    try:
        # Step 1: Generate embeddings using psra-embed service
        async with httpx.AsyncClient() as client:
            embed_response = await client.post(PSRA_EMBED_URL, json={"text": query})
            embed_response.raise_for_status()
            embedding = embed_response.json().get("embedding")
        
        # Step 2: Perform similarity search using psra-rag service
        rag_response = await client.post(PSRA_RAG_URL, json={"embedding": embedding, "top_k": 10})
        rag_response.raise_for_status()
        similar_rules = rag_response.json().get("similar_rules", [])
        
        # Step 3: Format the response
        formatted_rules = [
            Rule(
                rule_id=rule["rule_id"],
                description=rule["description"],
                hs_codes=rule["hs_codes"],
                similarity_score=rule["similarity_score"]
            )
            for rule in similar_rules
        ]
        
        return SimilarRulesResponse(query=query, similar_rules=formatted_rules)
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Error in external service")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
