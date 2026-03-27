# src/backend/core/observability.py
"""
OpenTelemetry integration for structured logging and observability.
Provides tracing, metrics, and logging for the backend services.
"""

from typing import Optional
import os
import logging

# OpenTelemetry imports
from opentelemetry import trace, metrics
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
import structlog

logger = logging.getLogger(__name__)


class ObservabilityManager:
    """Manages OpenTelemetry initialization and configuration."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.jaeger_exporter: Optional[JaegerExporter] = None
        self.trace_provider: Optional[TracerProvider] = None
        self.meter_provider: Optional[MeterProvider] = None
        self.tracer: Optional[trace.Tracer] = None
        self.is_initialized = False
    
    def initialize(
        self,
        service_name: str = "zizo-netverse-backend",
        jaeger_host: str = "localhost",
        jaeger_port: int = 6831,
        enable_jaeger: bool = True,
        enable_prometheus: bool = False
    ) -> bool:
        """
        Initialize OpenTelemetry tracing and metrics.
        
        Args:
            service_name: Name of the service for tracing
            jaeger_host: Jaeger exporter host
            jaeger_port: Jaeger exporter port
            enable_jaeger: Whether to enable Jaeger tracing
            enable_prometheus: Whether to enable Prometheus metrics
            
        Returns:
            bool: True if initialization successful
        """
        try:
            if self.is_initialized:
                logger.info("ObservabilityManager already initialized")
                return True
            
            # ==================== Setup Tracing ====================
            
            if enable_jaeger:
                self.jaeger_exporter = JaegerExporter(
                    agent_host_name=jaeger_host,
                    agent_port=jaeger_port,
                )
                
                self.trace_provider = TracerProvider()
                self.trace_provider.add_span_processor(
                    BatchSpanProcessor(self.jaeger_exporter)
                )
                
                trace.set_tracer_provider(self.trace_provider)
                logger.info(f"Jaeger tracing initialized: {jaeger_host}:{jaeger_port}")
            else:
                self.trace_provider = TracerProvider()
                trace.set_tracer_provider(self.trace_provider)
                logger.info("Tracer provider initialized (Jaeger disabled)")
            
            self.tracer = trace.get_tracer(__name__)
            
            # ==================== Setup Metrics ====================
            
            if enable_prometheus:
                prometheus_reader = PrometheusMetricReader()
                self.meter_provider = MeterProvider(metric_readers=[prometheus_reader])
                metrics.set_meter_provider(self.meter_provider)
                logger.info("Prometheus metrics initialized")
            else:
                self.meter_provider = MeterProvider()
                metrics.set_meter_provider(self.meter_provider)
                logger.info("Meter provider initialized (Prometheus disabled)")
            
            # ==================== Instrument Libraries ====================
            
            # Note: FastAPI instrumentation is applied after app creation in main.py
            # to avoid version compatibility issues
            
            # HTTP client instrumentation
            HTTPXClientInstrumentor().instrument()
            RequestsInstrumentor().instrument()
            
            # Redis instrumentation
            RedisInstrumentor().instrument()
            
            logger.info("Library instrumentation completed")
            
            # ==================== Setup Structured Logging ====================
            
            self._setup_structured_logging(service_name)
            
            self.is_initialized = True
            logger.info(f"✓ ObservabilityManager initialized for {service_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize ObservabilityManager: {e}")
            self.is_initialized = False
            return False
    
    def _setup_structured_logging(self, service_name: str):
        """Setup structlog for structured logging."""
        try:
            structlog.configure(
                processors=[
                    structlog.stdlib.filter_by_level,
                    structlog.stdlib.add_logger_name,
                    structlog.stdlib.add_log_level,
                    structlog.stdlib.PositionalArgumentsFormatter(),
                    structlog.processors.TimeStamper(fmt="iso"),
                    structlog.processors.StackInfoRenderer(),
                    structlog.processors.format_exc_info,
                    structlog.processors.UnicodeDecoder(),
                    structlog.processors.JSONRenderer()
                ],
                context_class=dict,
                logger_factory=structlog.stdlib.LoggerFactory(),
                cache_logger_on_first_use=True,
            )
            
            # Configure standard logging to work with structlog
            logging.basicConfig(
                format="%(message)s",
                stream=None,  # Will use structlog
                level=logging.INFO,
            )
            
            logger.info(f"Structured logging configured for {service_name}")
            
        except Exception as e:
            logger.error(f"Failed to setup structured logging: {e}")
    
    def get_tracer(self) -> trace.Tracer:
        """Get the tracer instance."""
        if not self.is_initialized:
            logger.warning("ObservabilityManager not initialized, returning no-op tracer")
            self.tracer = trace.get_tracer(__name__)
        
        return self.tracer
    
    def get_meter(self, name: str) -> metrics.Meter:
        """Get a meter instance."""
        if not self.is_initialized:
            logger.warning("ObservabilityManager not initialized")
        
        return metrics.get_meter(name)
    
    def shutdown(self):
        """Shutdown tracer provider and exporters."""
        try:
            if self.trace_provider:
                self.trace_provider.force_flush()
            
            if self.meter_provider:
                self.meter_provider.force_flush()
            
            logger.info("ObservabilityManager shutdown complete")
            self.is_initialized = False
            
        except Exception as e:
            logger.error(f"Error during ObservabilityManager shutdown: {e}")


def create_observability_manager(
    service_name: str = None,
    jaeger_host: str = None,
    jaeger_port: int = None,
    enable_jaeger: bool = None,
    enable_prometheus: bool = None
) -> ObservabilityManager:
    """
    Factory function to create and initialize the observability manager.
    Uses environment variables for configuration if not provided.
    """
    
    # Get values from environment or use defaults
    service_name = service_name or os.getenv("OTEL_SERVICE_NAME", "zizo-netverse-backend")
    jaeger_host = jaeger_host or os.getenv("JAEGER_HOST", "localhost")
    jaeger_port = jaeger_port or int(os.getenv("JAEGER_PORT", "6831"))
    enable_jaeger = enable_jaeger if enable_jaeger is not None else (
        os.getenv("ENABLE_JAEGER", "false").lower() == "true"
    )
    enable_prometheus = enable_prometheus if enable_prometheus is not None else (
        os.getenv("ENABLE_PROMETHEUS", "false").lower() == "true"
    )
    
    manager = ObservabilityManager()
    manager.initialize(
        service_name=service_name,
        jaeger_host=jaeger_host,
        jaeger_port=jaeger_port,
        enable_jaeger=enable_jaeger,
        enable_prometheus=enable_prometheus
    )
    
    return manager


# ==================== Context Managers for Spans ====================

def create_span(name: str, attributes: dict = None):
    """
    Create a new span with the tracer.
    
    Args:
        name: Span name
        attributes: Optional span attributes
        
    Usage:
        with create_span("operation_name", {"user_id": 123}):
            # Do work here
            pass
    """
    manager = ObservabilityManager()
    tracer = manager.get_tracer()
    
    if attributes is None:
        attributes = {}
    
    span = tracer.start_span(name, attributes=attributes)
    return _SpanContextManager(span)


class _SpanContextManager:
    """Context manager for OpenTelemetry spans."""
    
    def __init__(self, span):
        self.span = span
    
    def __enter__(self):
        return self.span
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.span.record_exception(exc_val)
            self.span.set_attribute("error", True)
        
        self.span.end()


# ==================== Metrics Helpers ====================

def record_metric(name: str, value: float, unit: str = "", attributes: dict = None):
    """
    Record a custom metric.
    
    Args:
        name: Metric name
        value: Metric value
        unit: Unit of measurement
        attributes: Optional metric attributes
    """
    try:
        manager = ObservabilityManager()
        meter = manager.get_meter(__name__)
        
        # Create a counter or histogram based on value type
        if isinstance(value, int) or isinstance(value, float):
            counter = meter.create_counter(name)
            counter.add(value, attributes or {})
        
    except Exception as e:
        logger.error(f"Error recording metric {name}: {e}")


# ==================== Logging Helpers ====================

def log_with_context(level: int, message: str, context: dict = None, **kwargs):
    """
    Log a message with OpenTelemetry context.
    
    Args:
        level: logging level (INFO, WARNING, ERROR, etc.)
        message: Log message
        context: Additional context dictionary
        **kwargs: Additional keyword arguments passed to logger
    """
    try:
        logger = structlog.get_logger(__name__)
        
        context_data = context or {}
        context_data.update(kwargs)
        
        if level == logging.ERROR:
            logger.error(message, **context_data)
        elif level == logging.WARNING:
            logger.warning(message, **context_data)
        elif level == logging.DEBUG:
            logger.debug(message, **context_data)
        else:
            logger.info(message, **context_data)
        
    except Exception as e:
        logging.log(level, f"{message} (logging with context failed: {e})")


def instrument_fastapi_app(app):
    """
    Instrument a FastAPI app with OpenTelemetry.
    
    This is called separately from initialize() to avoid version compatibility issues.
    
    Args:
        app: FastAPI application instance
    """
    try:
        FastAPIInstrumentor().instrument_app(app)
        logger.info("FastAPI app instrumented with OpenTelemetry")
    except Exception as e:
        logger.warning(f"Failed to instrument FastAPI app: {e}")

