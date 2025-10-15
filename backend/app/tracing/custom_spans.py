from opentelemetry import trace
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from app.tracing.opentelemetry_config import setup_tracing

# Initialize tracer (call setup_tracing first in your service)
tracer = setup_tracing("psra-service-name")

# Instrument external HTTP requests (automatic spans for requests library)
RequestsInstrumentor().instrument(tracer_provider=tracer._tracer_provider)

# Instrument SQLAlchemy (automatic spans for DB calls)
def instrument_sqlalchemy(engine):
    SQLAlchemyInstrumentor().instrument(engine=engine, tracer_provider=tracer._tracer_provider)

# Custom span utilities for business logic
def create_custom_span(name: str, attributes: dict = None):
    """
    Context manager for creating a custom span.
    - name: Span name (e.g., 'ml_inference').
    - attributes: Dict of key-value pairs to set on the span.
    """
    return tracer.start_as_span(name, attributes=attributes or {})

# Example usage in business logic
def perform_ml_inference(data):
    with create_custom_span("ml_inference", {"model.name": "psra-model", "input.size": len(data)}) as span:
        # Simulate ML call (replace with actual logic)
        result = {"prediction": "some_output"}
        span.set_attribute("output.size", len(result))
        return result

def query_database(query: str):
    with create_custom_span("db_query", {"db.statement": query}) as span:
        # Simulate DB query (replace with actual SQLAlchemy query)
        result = {"rows": 42}
        span.set_attribute("db.rows_returned", result["rows"])
        return result

def call_external_service(url: str):
    with create_custom_span("external_api_call", {"http.url": url}) as span:
        # Simulate external call (requests will auto-instrument)
        response = {"status": 200}
        span.set_attribute("http.status_code", response["status"])
        return response

# Usage in endpoints or services:
# result = perform_ml_inference(data)
# db_result = query_database("SELECT * FROM table")
# api_result = call_external_service("http://external-service")