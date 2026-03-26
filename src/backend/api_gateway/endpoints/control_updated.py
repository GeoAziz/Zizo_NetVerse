# src/backend/api_gateway/endpoints/control_updated.py
"""
Updated control endpoints with Redis-backed rate limiting.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, IPvAnyAddress, Field
from services.firewall_manager import firewall_manager
from core.rate_limiting import (
    get_rate_limiter,
    API_LIMIT_MODERATE,
    FIREWALL_LIMIT_BLOCK,
    RateLimitConfig,
    RateLimitStrategy
)
from .auth import require_role
from typing import Optional, List
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

# Create the dependency instance for analyst or admin
require_analyst = require_role(["analyst", "admin"])

router = APIRouter()


class BlockIPRequest(BaseModel):
    ip: IPvAnyAddress = Field(..., description="IP address to block")
    protocol: str = Field(default="all", description="Protocol to block (tcp, udp, all)")
    description: str = Field(default="", description="Reason for blocking")


class AllowIPRequest(BaseModel):
    ip: IPvAnyAddress = Field(..., description="IP address to allow")
    description: str = Field(default="", description="Reason for allowing")


class BlockPortRequest(BaseModel):
    port: int = Field(..., ge=1, le=65535, description="Port number to block")
    protocol: str = Field(default="tcp", description="Protocol (tcp, udp)")
    description: str = Field(default="", description="Reason for blocking")


class AllowPortRequest(BaseModel):
    port: int = Field(..., ge=1, le=65535, description="Port number to allow")
    protocol: str = Field(default="tcp", description="Protocol (tcp, udp)")
    description: str = Field(default="", description="Reason for allowing")


async def rate_limit_middleware(request: Request, config: RateLimitConfig):
    """
    Redis-backed rate limiting middleware.
    
    Args:
        request: FastAPI request
        config: Rate limit configuration
        
    Raises:
        HTTPException: 429 Too Many Requests if limit exceeded
    """
    rate_limiter = get_rate_limiter()
    
    if rate_limiter is None:
        logger.warning("Rate limiter unavailable, allowing request")
        return
    
    # Use client IP as the rate limit key
    client_ip = request.client.host if request.client else "unknown"
    limit_key = f"api:{client_ip}"
    
    # Check rate limit
    status = rate_limiter.check_rate_limit(limit_key, config)
    
    if not status.is_allowed:
        logger.warning(f"Rate limit exceeded for IP {client_ip}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many requests",
                "retry_after": status.retry_after,
                "requests_remaining": status.requests_remaining,
                "reset_at": status.reset_at.isoformat()
            }
        )


@router.post(
    "/control/block-ip",
    summary="Block an IP address",
    tags=["Control"]
)
async def block_ip(
    request: BlockIPRequest,
    user: dict = Depends(require_analyst)
) -> dict:
    """
    Block an IP address with Redis-backed rate limiting.
    
    **Rate Limit:** 20 blocks per minute per IP
    
    **Requires:** analyst or admin role
    """
    # Apply rate limiting
    limiter = get_rate_limiter()
    client_ip = "unknown"
    
    # For this endpoint specifically, use stricter limit
    status = limiter.check_rate_limit(
        f"firewall:block-ip:{client_ip}",
        FIREWALL_LIMIT_BLOCK
    ) if limiter else None
    
    if status and not status.is_allowed:
        logger.warning(f"Rate limit exceeded for block-ip endpoint")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many block requests",
                "retry_after": status.retry_after,
                "reset_at": status.reset_at.isoformat()
            },
            headers={"Retry-After": str(status.retry_after)}
        )
    
    try:
        # Block the IP
        firewall_manager.add_rule({
            "type": "ip",
            "action": "block",
            "value": str(request.ip),
            "protocol": request.protocol,
            "description": request.description,
            "created_by": user.get("username", "system")
        })
        
        logger.info(f"IP blocked: {request.ip} by {user.get('username')}")
        
        return {
            "status": "success",
            "message": f"IP {request.ip} blocked successfully",
            "ip": str(request.ip),
            "protocol": request.protocol
        }
    except Exception as e:
        logger.error(f"Error blocking IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/allow-ip",
    summary="Allow an IP address",
    tags=["Control"]
)
async def allow_ip(
    request: AllowIPRequest,
    user: dict = Depends(require_analyst)
) -> dict:
    """
    Allow an IP address.
    
    **Requires:** analyst or admin role
    """
    try:
        # Allow the IP
        firewall_manager.add_rule({
            "type": "ip",
            "action": "allow",
            "value": str(request.ip),
            "description": request.description,
            "created_by": user.get("username", "system")
        })
        
        logger.info(f"IP allowed: {request.ip} by {user.get('username')}")
        
        return {
            "status": "success",
            "message": f"IP {request.ip} allowed successfully",
            "ip": str(request.ip)
        }
    except Exception as e:
        logger.error(f"Error allowing IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/block-port",
    summary="Block a port",
    tags=["Control"]
)
async def block_port(
    request: BlockPortRequest,
    user: dict = Depends(require_analyst)
) -> dict:
    """
    Block a port with rate limiting.
    
    **Rate Limit:** 20 port blocks per minute
    
    **Requires:** analyst or admin role
    """
    # Apply rate limiting
    limiter = get_rate_limiter()
    if limiter:
        status = limiter.check_rate_limit(
            f"firewall:block-port:global",
            FIREWALL_LIMIT_BLOCK
        )
        
        if not status.is_allowed:
            logger.warning(f"Rate limit exceeded for block-port endpoint")
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Too many block requests",
                    "retry_after": status.retry_after,
                    "reset_at": status.reset_at.isoformat()
                },
                headers={"Retry-After": str(status.retry_after)}
            )
    
    try:
        # Block the port
        firewall_manager.add_rule({
            "type": "port",
            "action": "block",
            "value": request.port,
            "protocol": request.protocol,
            "description": request.description,
            "created_by": user.get("username", "system")
        })
        
        logger.info(f"Port blocked: {request.port}/{request.protocol} by {user.get('username')}")
        
        return {
            "status": "success",
            "message": f"Port {request.port}/{request.protocol} blocked successfully",
            "port": request.port,
            "protocol": request.protocol
        }
    except Exception as e:
        logger.error(f"Error blocking port: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/allow-port",
    summary="Allow a port",
    tags=["Control"]
)
async def allow_port(
    request: AllowPortRequest,
    user: dict = Depends(require_analyst)
) -> dict:
    """
    Allow a port.
    
    **Requires:** analyst or admin role
    """
    try:
        # Allow the port
        firewall_manager.add_rule({
            "type": "port",
            "action": "allow",
            "value": request.port,
            "protocol": request.protocol,
            "description": request.description,
            "created_by": user.get("username", "system")
        })
        
        logger.info(f"Port allowed: {request.port}/{request.protocol} by {user.get('username')}")
        
        return {
            "status": "success",
            "message": f"Port {request.port}/{request.protocol} allowed successfully",
            "port": request.port,
            "protocol": request.protocol
        }
    except Exception as e:
        logger.error(f"Error allowing port: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/control/rate-limit-status",
    summary="Get rate limit status",
    tags=["Control"]
)
async def get_rate_limit_status(
    request: Request,
    user: dict = Depends(require_analyst)
) -> dict:
    """
    Get current rate limit status for the requesting IP.
    
    **Requires:** analyst or admin role
    """
    limiter = get_rate_limiter()
    
    if not limiter:
        return {
            "status": "unavailable",
            "message": "Rate limiter not available"
        }
    
    client_ip = request.client.host if request.client else "unknown"
    stats = limiter.get_stats(f"api:{client_ip}")
    
    return {
        "status": "success",
        "client_ip": client_ip,
        "rate_limit_stats": stats
    }


@router.post(
    "/control/reset-rate-limit",
    summary="Reset rate limit for an IP",
    tags=["Control"]
)
async def reset_rate_limit(
    ip: str = Field(..., description="IP address to reset"),
    user: dict = Depends(require_role(["admin"]))  # Admin only
) -> dict:
    """
    Reset rate limit for a specific IP. Admin only.
    
    **Requires:** admin role
    """
    limiter = get_rate_limiter()
    
    if not limiter:
        raise HTTPException(status_code=500, detail="Rate limiter not available")
    
    success = limiter.reset_limit(f"api:{ip}")
    
    if success:
        logger.info(f"Rate limit reset for IP {ip} by {user.get('username')}")
        return {
            "status": "success",
            "message": f"Rate limit reset for {ip}",
            "ip": ip
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to reset rate limit")
