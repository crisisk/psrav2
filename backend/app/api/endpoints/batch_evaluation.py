from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, conlist
from typing import List
import asyncio
import time

app = FastAPI()

# Define the request and response models
class EvaluationRequest(BaseModel):
    product_id: str
    parameters: dict

class EvaluationResponse(BaseModel):
    product_id: str
    result: dict
    processing_time_ms: float

class BatchEvaluationResponse(BaseModel):
    results: List[EvaluationResponse]
    total_processing_time_ms: float

# Mock evaluation function (replace with actual evaluation logic)
async def evaluate_product(request: EvaluationRequest) -> EvaluationResponse:
    # Simulate processing time
    await asyncio.sleep(0.1)
    return EvaluationResponse(
        product_id=request.product_id,
        result={"status": "success", "score": 95},
        processing_time_ms=100.0
    )

@app.post("/evaluations/batch", response_model=BatchEvaluationResponse)
async def batch_evaluate(requests: conlist(EvaluationRequest, max_items=50)):
    start_time = time.time()

    # Process all requests in parallel
    tasks = [evaluate_product(request) for request in requests]
    results = await asyncio.gather(*tasks)

    total_processing_time_ms = (time.time() - start_time) * 1000

    return BatchEvaluationResponse(
        results=results,
        total_processing_time_ms=total_processing_time_ms
    )

# Error handling for invalid input
@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    raise HTTPException(status_code=400, detail=str(exc))