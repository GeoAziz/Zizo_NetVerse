"""
Health Check Endpoints for Backend FastAPI
Provides Kubernetes-compatible health checks
"""

from fastapi import APIRouter
from datetime import datetime
from core.config import settings

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health_check():
    """
    General health check endpoint
    Returns the overall health status of the backend
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.PROJECT_NAME,
        "version": "0.1.0",
    }


@router.get("/health/live")
async def liveness_probe():
    """
    Kubernetes liveness probe
    Check if service is still running (not deadlocked)
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_probe():
    """
    Kubernetes readiness probe
    Check if service is ready to accept traffic
    """
    # Add checks for critical dependencies here
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "ready_to_serve": True,
    }
