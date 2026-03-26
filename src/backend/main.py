# src/backend/main.py

from fastapi import FastAPI
from contextlib import asynccontextmanager
from api_gateway.endpoints import (
    auth,
    logs,
    websockets,
    visualization_websockets,
    control,
    threat_actions,
    proxy,
    ai_analysis,
    threat_feeds,
    siem,
    alerts,
    devices,
    control_device,
    users,
    device_manager,
    health,
    traceroute,
)
from core.config import settings
from core.observability import create_observability_manager
from services import firebase_admin
from services.message_queue import message_queue
from services.network_capture import network_capture
from services.firewall_manager import firewall_manager
from starlette.middleware.cors import CORSMiddleware
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
import asyncio
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

# Initialize OpenTelemetry observability
observability_manager = create_observability_manager(
    service_name="zizo-netverse-backend",
    enable_jaeger=os.getenv("ENABLE_JAEGER", "false").lower() == "true",
    enable_prometheus=os.getenv("ENABLE_PROMETHEUS", "false").lower() == "true"
)

# Initialize Firebase Admin SDK - this is crucial to do before anything else
firebase_admin.initialize_firebase_admin()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown events.
    """
    # Startup
    logger.info("🔥 Starting Zizo_NetVerse Backend Engine...")
    try:
        await message_queue.initialize()
        logger.info("✅ Message queue initialized")
        
        # Initialize firewall manager
        await firewall_manager.initialize()
        logger.info("✅ Firewall manager initialized")
        
        if settings.CAPTURE_ENABLED:
            logger.info("🎯 Starting packet capture service...")
            asyncio.create_task(network_capture.start_capture())
        else:
            logger.info("📊 Packet capture disabled in configuration.")
            
        logger.info("🚀 All services initialized successfully!")
    except Exception as e:
        logger.error(f"❌ Error during startup: {e}")
        # Optionally, you could raise the error to prevent startup
        # raise e

    yield

    # Shutdown
    logger.info("🛑 Shutting down Zizo_NetVerse Backend Engine...")
    try:
        if network_capture.is_capturing:
            network_capture.stop_capture()
        await message_queue.close()
        
        # Shutdown observability manager
        observability_manager.shutdown()
        
        logger.info("✅ Clean shutdown completed")
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Zizo_NetVerse Backend Engine - Advanced Cybersecurity Command Deck",
    version="1.0.0",
    lifespan=lifespan
)

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# Set all CORS enabled origins
if settings.cors_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "🚀 Welcome to the Zizo_NetVerse Backend Engine!",
        "status": "operational",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "services": {
            "firebase": "connected" if firebase_admin._apps else "disconnected",
            "capture": "ready" if network_capture else "unavailable",
            "message_queue": "ready" if message_queue.redis_client else "unavailable",
            "firewall": firewall_manager.get_backend_info()
        }
    }


# Include routers from the api_gateway
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(logs.router, prefix=settings.API_V1_STR, tags=["Network Logs"])
app.include_router(websockets.router, prefix=settings.API_V1_STR, tags=["WebSocket Streaming"])
app.include_router(visualization_websockets.router, prefix=settings.API_V1_STR, tags=["Visualization WebSocket"])
app.include_router(control.router, prefix=settings.API_V1_STR, tags=["Control"])
app.include_router(traceroute.router, prefix=settings.API_V1_STR, tags=["Traceroute"])
app.include_router(threat_actions.router, prefix=settings.API_V1_STR, tags=["Threat Actions"])
app.include_router(proxy.router, prefix=settings.API_V1_STR, tags=["Proxy"])
app.include_router(ai_analysis.router, prefix=settings.API_V1_STR, tags=["AI Analysis"])
app.include_router(threat_feeds.router, prefix=settings.API_V1_STR, tags=["Threat Feeds"])
app.include_router(siem.router, prefix=settings.API_V1_STR, tags=["SIEM Integration"])
app.include_router(alerts.router, prefix=settings.API_V1_STR, tags=["Alerts"])
app.include_router(devices.router, prefix=settings.API_V1_STR, tags=["Devices"])
app.include_router(control_device.router, prefix=settings.API_V1_STR, tags=["Device Control"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["User Management"])
app.include_router(device_manager.router, prefix=settings.API_V1_STR, tags=["Device Management"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
