from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, IPvAnyAddress, Field
import time
from services.firewall_manager import firewall_manager
from .auth import require_role
from typing import Optional, List

# Create the dependency instance for analyst or admin
require_analyst = require_role(["analyst", "admin"])

router = APIRouter()

RATE_LIMIT = {}
async def rate_limiter(req: Request):
    ip = req.client.host
    now = time.time()
    window = 10  # seconds
    max_requests = 5
    if ip not in RATE_LIMIT:
        RATE_LIMIT[ip] = []
    RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if now - t < window]
    if len(RATE_LIMIT[ip]) >= max_requests:
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
    RATE_LIMIT[ip].append(now)


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


@router.post(
    "/control/block-ip",
    tags=["Control"],
    dependencies=[Depends(require_analyst), Depends(rate_limiter)]
)
async def block_ip(
    request: BlockIPRequest,
    user=Depends(require_analyst)
):
    """
    Block an IP address using the system firewall.
    
    Supports both iptables (Linux) and UFW backends.
    Requires analyst or admin role.
    
    **Args:**
    - ip: IP address to block
    - protocol: Protocol to block (tcp, udp, all) - default: all
    - description: Optional reason for blocking
    """
    try:
        success = await firewall_manager.block_ip(
            str(request.ip),
            protocol=request.protocol,
            description=request.description
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to block IP. Firewall backend may not be available."
            )
        
        return {
            "status": "success",
            "action": "blocked",
            "ip": str(request.ip),
            "protocol": request.protocol,
            "message": f"IP {request.ip} blocked successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/allow-ip",
    tags=["Control"],
    dependencies=[Depends(require_analyst), Depends(rate_limiter)]
)
async def allow_ip(
    request: AllowIPRequest,
    user=Depends(require_analyst)
):
    """
    Allow traffic from an IP address using the system firewall.
    
    Requires analyst or admin role.
    """
    try:
        success = await firewall_manager.allow_ip(
            str(request.ip),
            description=request.description
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to allow IP. Firewall backend may not be available."
            )
        
        return {
            "status": "success",
            "action": "allowed",
            "ip": str(request.ip),
            "message": f"IP {request.ip} allowed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/block-port",
    tags=["Control"],
    dependencies=[Depends(require_analyst), Depends(rate_limiter)]
)
async def block_port(
    request: BlockPortRequest,
    user=Depends(require_analyst)
):
    """
    Block incoming traffic on a specific port.
    
    Requires analyst or admin role.
    """
    try:
        success = await firewall_manager.block_port(
            request.port,
            protocol=request.protocol,
            description=request.description
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to block port. Firewall backend may not be available."
            )
        
        return {
            "status": "success",
            "action": "blocked",
            "port": request.port,
            "protocol": request.protocol,
            "message": f"Port {request.port}/{request.protocol} blocked successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/control/allow-port",
    tags=["Control"],
    dependencies=[Depends(require_analyst), Depends(rate_limiter)]
)
async def allow_port(
    request: AllowPortRequest,
    user=Depends(require_analyst)
):
    """
    Allow incoming traffic on a specific port.
    
    Requires analyst or admin role.
    """
    try:
        success = await firewall_manager.allow_port(
            request.port,
            protocol=request.protocol,
            description=request.description
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to allow port. Firewall backend may not be available."
            )
        
        return {
            "status": "success",
            "action": "allowed",
            "port": request.port,
            "protocol": request.protocol,
            "message": f"Port {request.port}/{request.protocol} allowed successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/control/firewall-rules",
    tags=["Control"],
    dependencies=[Depends(require_analyst)]
)
async def list_firewall_rules(
    user=Depends(require_analyst)
):
    """
    List all active firewall rules.
    
    Requires analyst or admin role.
    """
    try:
        rules = await firewall_manager.list_rules()
        backend_info = firewall_manager.get_backend_info()
        
        return {
            "status": "success",
            "backend": backend_info,
            "rules_count": len(rules),
            "rules": rules[:50]  # Return first 50 rules
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/control/firewall-status",
    tags=["Control"]
)
async def get_firewall_status():
    """Get firewall backend status and configuration."""
    try:
        backend_info = firewall_manager.get_backend_info()
        rules_log = firewall_manager.get_rules_log(limit=10)
        
        return {
            "status": "success",
            "firewall": backend_info,
            "recent_actions": rules_log
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/control/firewall-log",
    tags=["Control"],
    dependencies=[Depends(require_analyst)]
)
async def get_firewall_log(
    limit: int = 100,
    user=Depends(require_analyst)
):
    """
    Get history of firewall rule applications.
    
    Requires analyst or admin role.
    """
    try:
        log = firewall_manager.get_rules_log(limit=limit)
        
        return {
            "status": "success",
            "count": len(log),
            "log": log
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
