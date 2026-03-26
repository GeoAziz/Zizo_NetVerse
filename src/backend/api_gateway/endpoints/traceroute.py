# src/backend/api_gateway/endpoints/traceroute.py
"""
Traceroute Endpoints - API for hop analysis and path visualization
"""

from fastapi import APIRouter, HTTPException, Query, Path, Depends
from typing import Optional, List
from pydantic import BaseModel, Field
import logging

from services.traceroute_service import traceroute_service, HopData, HopPath
from api_gateway.endpoints.auth import get_current_user, AuthUser

logger = logging.getLogger(__name__)
router = APIRouter()


# Request/Response Models
class HopInfo(BaseModel):
    """Hop information for API response"""
    hop_number: int
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    rtt_ms: List[float]
    packet_loss_percent: float = 0.0
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "hop_number": 1,
                "ip_address": "192.168.1.1",
                "hostname": "router.local",
                "rtt_ms": [1.234, 1.345, 1.456],
                "packet_loss_percent": 0.0,
                "country": "US",
                "latitude": 40.7128,
                "longitude": -74.0060
            }
        }


class TracerouteRequest(BaseModel):
    """Request model for traceroute"""
    destination: str = Field(..., description="Destination IP address or hostname")
    source_ip: Optional[str] = Field(None, description="Source IP for trace")
    max_hops: int = Field(30, ge=1, le=50, description="Maximum hops to follow")
    timeout: int = Field(5, ge=1, le=30, description="Timeout per hop in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "destination": "8.8.8.8",
                "source_ip": "192.168.1.100",
                "max_hops": 30,
                "timeout": 5
            }
        }


class TracerouteResponse(BaseModel):
    """Response model for traceroute results"""
    source_ip: str
    destination_ip: str
    destination_hostname: Optional[str] = None
    hops: List[HopInfo]
    total_hops: int
    average_rtt_ms: float
    packet_loss_percent: float

    class Config:
        json_schema_extra = {
            "example": {
                "source_ip": "192.168.1.100",
                "destination_ip": "8.8.8.8",
                "destination_hostname": "dns.google",
                "hops": [
                    {
                        "hop_number": 1,
                        "ip_address": "192.168.1.1",
                        "hostname": "router.local",
                        "rtt_ms": [1.2, 1.3, 1.4],
                        "packet_loss_percent": 0.0
                    }
                ],
                "total_hops": 12,
                "average_rtt_ms": 35.45,
                "packet_loss_percent": 0.0
            }
        }


# Endpoints
@router.post(
    "/network/trace",
    response_model=TracerouteResponse,
    tags=["Network"],
    summary="Trace route to destination",
    description="Perform a traceroute to analyze the hop path to a destination IP"
)
async def trace_route(
    request: TracerouteRequest,
    current_user: AuthUser = Depends(get_current_user)
) -> TracerouteResponse:
    """
    Perform a traceroute to analyze the network path to a destination.
    
    This endpoint traces the hops between the source and destination IP,
    collecting RTT and hostname information for visualization.
    
    **Args:**
    - destination: Target IP address or hostname
    - source_ip: Optional source IP for the trace
    - max_hops: Maximum number of hops to follow (1-50)
    - timeout: Timeout per hop in seconds (1-30)
    
    **Returns:**
    - Complete hop path with RTT and packet loss information
    """
    try:
        logger.info(
            f"User {current_user.email} requested traceroute to {request.destination}"
        )

        # Execute traceroute
        hop_path: HopPath = await traceroute_service.trace_path(
            destination=request.destination,
            source_ip=request.source_ip,
            max_hops=request.max_hops,
            timeout=request.timeout
        )

        # Convert hops to response format
        hops = [
            HopInfo(
                hop_number=h.hop_number,
                ip_address=h.ip_address,
                hostname=h.hostname,
                rtt_ms=h.rtt_ms,
                packet_loss_percent=h.packet_loss_percent,
                country=h.country,
                latitude=h.latitude,
                longitude=h.longitude
            )
            for h in hop_path.hops
        ]

        response = TracerouteResponse(
            source_ip=hop_path.source_ip,
            destination_ip=hop_path.destination_ip,
            destination_hostname=hop_path.destination_hostname,
            hops=hops,
            total_hops=hop_path.total_hops,
            average_rtt_ms=hop_path.average_rtt_ms,
            packet_loss_percent=hop_path.packet_loss_percent
        )

        logger.info(f"Traceroute completed: {hop_path.total_hops} hops")
        return response

    except Exception as e:
        logger.error(f"Traceroute failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Traceroute failed: {str(e)}"
        )


@router.get(
    "/network/trace/{destination}",
    response_model=TracerouteResponse,
    tags=["Network"],
    summary="Quick trace to destination",
    description="Perform a quick traceroute with default parameters"
)
async def quick_trace(
    destination: str = Path(..., description="Destination IP or hostname"),
    max_hops: int = Query(30, ge=1, le=50),
    current_user: AuthUser = Depends(get_current_user)
) -> TracerouteResponse:
    """
    Perform a quick traceroute with default parameters.
    
    **Args:**
    - destination: Target IP address or hostname
    - max_hops: Maximum hops to follow
    
    **Returns:**
    - Complete hop path information
    """
    request = TracerouteRequest(
        destination=destination,
        max_hops=max_hops
    )
    return await trace_route(request, current_user)


@router.get(
    "/network/tracejson",
    tags=["Network"],
    summary="Get hop data as optimized JSON",
    description="Get traceroute results in a format optimized for globe visualization"
)
async def get_trace_json(
    destination: str = Query(..., description="Destination IP or hostname"),
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Get traceroute results in a format optimized for 3D globe visualization.
    
    Returns hop data with geographic information for rendering on a 3D globe.
    """
    try:
        hop_path = await traceroute_service.trace_path(destination)

        return {
            "status": "success",
            "destination": destination,
            "destination_ip": hop_path.destination_ip,
            "source_ip": hop_path.source_ip,
            "hops": [
                {
                    "number": h.hop_number,
                    "ip": h.ip_address,
                    "host": h.hostname,
                    "rtts": h.rtt_ms,
                    "loss": h.packet_loss_percent,
                    "loc": {
                        "lat": h.latitude or 0,
                        "lon": h.longitude or 0,
                        "country": h.country
                    }
                }
                for h in hop_path.hops
            ],
            "stats": {
                "total_hops": hop_path.total_hops,
                "avg_rtt": hop_path.average_rtt_ms,
                "total_loss": hop_path.packet_loss_percent
            }
        }

    except Exception as e:
        logger.error(f"Trace JSON failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trace data: {str(e)}"
        )
