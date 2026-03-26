"""
Health Check Endpoint for Backend
Add this to src/backend/api_gateway/endpoints/health.py
"""

from fastapi import APIRouter, HTTPException
from services.redis_service import redis_client
from services.message_queue import message_queue
from core.config import settings
from datetime import datetime
import psutil

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns the overall health status of the backend
    """
    try:
        health_status = {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.PROJECT_NAME,
            "version": "0.1.0",
        }

        # Check Redis connection
        try:
            await redis_client.ping()
            health_status["redis"] = "connected"
        except Exception as e:
            health_status["redis"] = f"error: {str(e)}"

        # Check CPU and memory
        try:
            health_status["cpu_percent"] = psutil.cpu_percent(interval=1)
            health_status["memory_percent"] = psutil.virtual_memory().percent
        except Exception as e:
            health_status["system_metrics"] = f"error: {str(e)}"

        return health_status

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe
    Check if service is running
    """
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_check():
    """
    Kubernetes readiness probe
    Check if service is ready to accept traffic
    """
    try:
        # Check critical dependencies
        await redis_client.ping()
        return {"status": "ready"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service not ready: {str(e)}"
        )
