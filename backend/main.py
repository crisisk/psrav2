"""
PSRA-LTSD Enterprise Backend - Main FastAPI Application

This is the main entry point for the PSRA-LTSD backend service.
It integrates all routers, middleware, and monitoring capabilities.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# Import routers
from backend.api.ltsd_router import router as ltsd_router
from backend.api.jobs_router import router as jobs_router
from backend.api.erp_status_router import router as erp_status_router
from backend.api.predictive_router import router as predictive_router

# Import Prometheus middleware and metrics
from backend.middleware.prometheus_exporter import (
    PrometheusMiddleware,
    metrics_endpoint,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# Create FastAPI application
app = FastAPI(
    title="PSRA-LTSD Enterprise API",
    version="2.0.0",
    description="Preferential Scheme Rules of Origin Assessment and Long-Term Supplier Declaration Management System",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add Prometheus middleware for metrics collection
app.add_middleware(PrometheusMiddleware)


# Health check endpoints
@app.get("/healthz", tags=["health"])
async def health_check():
    """Kubernetes liveness probe - checks if the application is running."""
    return {"status": "healthy", "service": "psra-ltsd-enterprise"}


@app.get("/readyz", tags=["health"])
async def readiness_check():
    """Kubernetes readiness probe - checks if the application is ready to serve traffic."""
    try:
        # Add any dependency checks here (database, cache, etc.)
        return {"status": "ready", "service": "psra-ltsd-enterprise"}
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "error": str(e)}
        )


# Mount Prometheus metrics endpoint
@app.get("/metrics", tags=["observability"])
async def metrics(request: Request):
    """
    Prometheus metrics endpoint.

    Exposes application metrics in Prometheus format for scraping.
    Metrics include:
    - HTTP request counts and latencies
    - Active requests
    - HS code lookups
    - Origin assessments
    - LTSD operations
    - Webhook deliveries
    - LLM API calls and costs
    - Cache hit/miss rates
    - Database query performance
    """
    return await metrics_endpoint(request)


# Include routers
app.include_router(
    ltsd_router,
    prefix="/api/v1/ltsd",
    tags=["ltsd"]
)

app.include_router(
    jobs_router,
    tags=["jobs"]
)

app.include_router(
    erp_status_router,
    prefix="/api/v1/erp",
    tags=["erp"]
)

app.include_router(
    predictive_router,
    prefix="/api/v1/predictive",
    tags=["predictive"]
)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "PSRA-LTSD Enterprise API",
        "version": "2.0.0",
        "docs": "/api/docs",
        "health": "/healthz",
        "readiness": "/readyz",
        "metrics": "/metrics"
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "path": request.url.path
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
