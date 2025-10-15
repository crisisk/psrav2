import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace.sampling import TraceIdRatioBasedSampler
from opentelemetry.propagators.textmap import TextMapPropagator
from opentelemetry.propagators.b3 import B3MultiPropagator
from opentelemetry.propagators.tracecontext import TraceContextPropagator
from opentelemetry.instrumentation.logging import LoggingInstrumentor

# Configure logging to include trace context
LoggingInstrumentor().instrument()

def setup_tracing(service_name: str, jaeger_host: str = "jaeger-collector", jaeger_port: int = 14268, sampling_rate: float = 0.1):
    """
    Initialize OpenTelemetry tracing with Jaeger exporter.
    - service_name: Name of the service (e.g., 'psra-service-1').
    - jaeger_host/port: Jaeger collector endpoint.
    - sampling_rate: Probabilistic sampling rate (0.1 = 10% for production).
    """
    # Set up TracerProvider
    trace.set_tracer_provider(TracerProvider(resource=trace.Resource.create({"service.name": service_name})))
    
    # Configure sampling for production (intelligent sampling to reduce overhead)
    sampler = TraceIdRatioBasedSampler(sampling_rate)
    trace.get_tracer_provider().sampler = sampler
    
    # Jaeger exporter for trace export
    jaeger_exporter = JaegerExporter(
        agent_host_name=jaeger_host,
        agent_port=jaeger_port,
    )
    span_processor = BatchSpanProcessor(jaeger_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)
    
    # Set up propagators for W3C Trace Context (and B3 for compatibility)
    propagators = [TraceContextPropagator(), B3MultiPropagator()]
    trace.set_global_textmap_propagator(TextMapPropagator(composite=propagators))
    
    # Get a tracer instance for the service
    tracer = trace.get_tracer(__name__)
    return tracer

# Example usage in a service's main.py:
# from app.tracing.opentelemetry_config import setup_tracing
# tracer = setup_tracing("psra-service-name")