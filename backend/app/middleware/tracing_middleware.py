from fastapi import Request, Response
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from app.tracing.opentelemetry_config import setup_tracing

def setup_fastapi_tracing(app, service_name: str):
    """
    Instrument FastAPI app with OpenTelemetry for automatic span creation on endpoints.
    - app: FastAPI app instance.
    - service_name: Name of the service.
    """
    # Initialize tracing
    tracer = setup_tracing(service_name)
    
    # Instrument FastAPI (creates spans for all endpoints, including HTTP calls)
    FastAPIInstrumentor.instrument_app(app, tracer_provider=tracer._tracer_provider)
    
    # Optional: Custom middleware for additional context (e.g., user ID from headers)
    @app.middleware("http")
    async def tracing_middleware(request: Request, call_next):
        with tracer.start_as_span(f"{request.method} {request.url.path}") as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.url", str(request.url))
            # Add custom attributes if needed (e.g., from auth)
            response = await call_next(request)
            span.set_attribute("http.status_code", response.status_code)
            return response

# Usage in a service's main.py:
# from app.middleware.tracing_middleware import setup_fastapi_tracing
# app = FastAPI()
# setup_fastapi_tracing(app, "psra-service-name")