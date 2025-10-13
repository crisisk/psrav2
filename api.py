"""
LangGraph Origin Engine - API Implementation

This module implements the FastAPI endpoints for the LangGraph Origin Engine.
It provides a RESTful API for calculating the origin of products and managing calculation threads.
"""

import os
import json
import time
import uuid
import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query, Path, Body, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, validator

from .origin_calculation_graph import (
    Product, TradeAgreement, Component, ManufacturingProcess,
    OriginReport, OriginState, calculate_origin,
    get_thread_state, continue_thread, interrupt_thread, list_threads
)

# Configure environment
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ENABLE_CACHING = os.getenv("ENABLE_CACHING", "true").lower() == "true"
CACHE_TTL = int(os.getenv("CACHE_TTL", "86400"))  # 24 hours

# Configure logging
import logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("origin_engine_api")

# Create the FastAPI app
app = FastAPI(
    title="LangGraph Origin Engine API",
    description="API for calculating the origin of products using LangGraph",
    version="2.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 password bearer for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In-memory cache
cache = {}

# Define API models
class CalculationRequest(BaseModel):
    """Request model for origin calculation."""
    product: Product
    trade_agreements: List[TradeAgreement]
    async_calculation: bool = False

class ThreadRequest(BaseModel):
    """Request model for thread operations."""
    thread_id: str

class CalculationResponse(BaseModel):
    """Response model for origin calculation."""
    report: Optional[OriginReport] = None
    thread_id: Optional[str] = None
    status: str
    message: str

class ThreadListResponse(BaseModel):
    """Response model for thread listing."""
    threads: List[str]

class ThreadStateResponse(BaseModel):
    """Response model for thread state."""
    thread_id: str
    state: Dict[str, Any]
    status: str

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    version: str
    timestamp: str
    uptime: float
    memory_usage: Dict[str, float]
    thread_count: int

# Define API endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    import psutil
    import gc
    
    # Get process info
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    # Get thread count
    thread_count = len(list_threads())
    
    # Force garbage collection
    gc.collect()
    
    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.time() - process.create_time(),
        "memory_usage": {
            "rss": memory_info.rss / (1024 * 1024),  # MB
            "vms": memory_info.vms / (1024 * 1024),  # MB
        },
        "thread_count": thread_count
    }

@app.post("/calculate", response_model=CalculationResponse)
async def calculate(
    request: CalculationRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(oauth2_scheme)
):
    """Calculate the origin of a product."""
    # Generate a thread ID
    thread_id = str(uuid.uuid4())
    
    # Check cache if enabled
    if ENABLE_CACHING:
        cache_key = json.dumps({
            "product": request.product.dict(),
            "trade_agreements": [ta.dict() for ta in request.trade_agreements]
        }, sort_keys=True)
        
        if cache_key in cache and cache[cache_key]["expires_at"] > time.time():
            logger.info(f"Cache hit for calculation request")
            return {
                "report": cache[cache_key]["report"],
                "thread_id": None,
                "status": "completed",
                "message": "Origin calculation completed (cached)"
            }
    
    # If async calculation is requested, run in background
    if request.async_calculation:
        # Start calculation in background
        background_tasks.add_task(
            _calculate_async,
            request.product,
            request.trade_agreements,
            thread_id
        )
        
        return {
            "report": None,
            "thread_id": thread_id,
            "status": "processing",
            "message": "Origin calculation started"
        }
    
    # Otherwise, run synchronously
    try:
        # Calculate origin
        report = calculate_origin(
            product=request.product,
            trade_agreements=request.trade_agreements,
            thread_id=thread_id
        )
        
        # Cache result if enabled
        if ENABLE_CACHING:
            cache_key = json.dumps({
                "product": request.product.dict(),
                "trade_agreements": [ta.dict() for ta in request.trade_agreements]
            }, sort_keys=True)
            
            cache[cache_key] = {
                "report": report,
                "expires_at": time.time() + CACHE_TTL
            }
        
        return {
            "report": report,
            "thread_id": thread_id,
            "status": "completed",
            "message": "Origin calculation completed"
        }
    
    except Exception as e:
        logger.error(f"Error calculating origin: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating origin: {str(e)}"
        )

@app.get("/thread/{thread_id}", response_model=ThreadStateResponse)
async def get_thread(
    thread_id: str = Path(..., description="The ID of the thread"),
    token: str = Depends(oauth2_scheme)
):
    """Get the state of a thread."""
    try:
        # Get thread state
        state = get_thread_state(thread_id)
        
        # Determine status
        status = "completed" if state.get("report") is not None else "processing"
        if state.get("errors") and len(state["errors"]) > 0:
            status = "error"
        
        return {
            "thread_id": thread_id,
            "state": state,
            "status": status
        }
    
    except Exception as e:
        logger.error(f"Error getting thread state: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=f"Thread not found: {thread_id}"
        )

@app.post("/thread/{thread_id}/continue", response_model=CalculationResponse)
async def continue_calculation(
    thread_id: str = Path(..., description="The ID of the thread"),
    token: str = Depends(oauth2_scheme)
):
    """Continue a thread that was interrupted."""
    try:
        # Continue thread
        report = continue_thread(thread_id)
        
        return {
            "report": report,
            "thread_id": thread_id,
            "status": "completed",
            "message": "Origin calculation completed"
        }
    
    except Exception as e:
        logger.error(f"Error continuing thread: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error continuing thread: {str(e)}"
        )

@app.post("/thread/{thread_id}/interrupt")
async def interrupt_calculation(
    thread_id: str = Path(..., description="The ID of the thread"),
    token: str = Depends(oauth2_scheme)
):
    """Interrupt a thread."""
    try:
        # Interrupt thread
        interrupt_thread(thread_id)
        
        return {
            "thread_id": thread_id,
            "status": "interrupted",
            "message": "Thread interrupted"
        }
    
    except Exception as e:
        logger.error(f"Error interrupting thread: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interrupting thread: {str(e)}"
        )

@app.get("/threads", response_model=ThreadListResponse)
async def get_threads(token: str = Depends(oauth2_scheme)):
    """List all active threads."""
    try:
        # List threads
        threads = list_threads()
        
        return {
            "threads": threads
        }
    
    except Exception as e:
        logger.error(f"Error listing threads: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error listing threads: {str(e)}"
        )

@app.post("/calculate/stream")
async def calculate_stream(
    request: CalculationRequest,
    token: str = Depends(oauth2_scheme)
):
    """Calculate the origin of a product and stream the results."""
    # Generate a thread ID
    thread_id = str(uuid.uuid4())
    
    # Create the streaming response
    return StreamingResponse(
        _stream_calculation(request.product, request.trade_agreements, thread_id),
        media_type="text/event-stream"
    )

# Helper functions
async def _calculate_async(
    product: Product,
    trade_agreements: List[TradeAgreement],
    thread_id: str
):
    """Calculate origin asynchronously."""
    try:
        # Calculate origin
        calculate_origin(
            product=product,
            trade_agreements=trade_agreements,
            thread_id=thread_id
        )
    
    except Exception as e:
        logger.error(f"Error in async calculation: {str(e)}")

async def _stream_calculation(
    product: Product,
    trade_agreements: List[TradeAgreement],
    thread_id: str
):
    """Stream the calculation results."""
    # Create the origin engine
    from .origin_calculation_graph import create_origin_engine
    engine = create_origin_engine()
    
    # Create the initial state
    state: OriginState = {
        "product": product,
        "trade_agreements": trade_agreements,
        "component_analysis": None,
        "manufacturing_analysis": None,
        "origin_determination": None,
        "preferential_status": None,
        "current_step": "initialized",
        "errors": [],
        "start_time": time.time(),
        "checkpoints": {},
        "report": None
    }
    
    try:
        # Run the workflow
        for event in engine.stream(state, {"configurable": {"thread_id": thread_id}}):
            if "intermediate_state" in event:
                current_state = event["intermediate_state"]
                
                # Yield the current state as a server-sent event
                yield f"data: {json.dumps({'thread_id': thread_id, 'state': current_state})}\n\n"
                
                # Add a small delay to avoid overwhelming the client
                await asyncio.sleep(0.1)
        
        # Get the final state
        final_state = engine.get_state(thread_id)
        
        # Yield the final state
        yield f"data: {json.dumps({'thread_id': thread_id, 'state': final_state, 'final': True})}\n\n"
    
    except Exception as e:
        logger.error(f"Error in streaming calculation: {str(e)}")
        yield f"data: {json.dumps({'thread_id': thread_id, 'error': str(e)})}\n\n"
    
    finally:
        # Clean up the thread
        engine.end_session(thread_id)

# Main function
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
