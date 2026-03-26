# src/backend/api_gateway/endpoints/device_manager.py

from fastapi import APIRouter, HTTPException, Depends, Query
from services.device_manager import device_manager, Device
from .auth import require_role
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Create the dependency instance for analyst or admin
require_analyst = require_role(["analyst", "admin"])


@router.post(
    "/device-manager/discover",
    tags=["Device Management"]
)
async def discover_devices(
    network_range: str = "192.168.1.0/24",
    detailed_scan: bool = False,
    user=Depends(require_analyst)
):
    """
    Discover all devices on a network.
    
    **Args:**
    - network_range: Network to scan in CIDR notation (default: 192.168.1.0/24)
    - detailed_scan: Run NMAP scan for detailed information (slower)
    
    **Returns:**
    - List of discovered devices with IP, MAC, OS, hostname, and open ports
    """
    try:
        logger.info(f"Starting device discovery on {network_range}")
        
        devices = await device_manager.discover_devices(
            network_range=network_range,
            detailed_scan=detailed_scan
        )
        
        return {
            "status": "success",
            "discovery_complete": True,
            "network": network_range,
            "devices_found": len(devices),
            "devices": [
                {
                    "id": d.id,
                    "ip": d.ip,
                    "mac": d.mac,
                    "hostname": d.hostname,
                    "os": d.os,
                    "status": d.status,
                    "open_ports": d.open_ports,
                    "services": d.services,
                    "first_seen": d.first_seen,
                    "last_seen": d.last_seen
                }
                for d in devices
            ]
        }
    except Exception as e:
        logger.error(f"Device discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/device-manager/scan/{device_ip}",
    tags=["Device Management"]
)
async def scan_device(
    device_ip: str,
    scan_type: str = Query("detailed", pattern="^(basic|detailed|aggressive)$"),
    user=Depends(require_analyst)
):
    """
    Scan a specific device for detailed information.
    
    **Args:**
    - device_ip: IP address of device to scan
    - scan_type: Type of scan - basic (quick), detailed (thorough), aggressive (intensive)
    
    **Returns:**
    - Detailed device information including OS, services, and open ports
    """
    try:
        logger.info(f"Scanning device {device_ip} with {scan_type} mode")
        
        device = await device_manager.scan_device(device_ip, scan_type)
        
        if not device:
            raise HTTPException(status_code=500, detail="Failed to scan device")
        
        return {
            "status": "success",
            "device": {
                "id": device.id,
                "ip": device.ip,
                "mac": device.mac,
                "hostname": device.hostname,
                "os": device.os,
                "status": device.status,
                "open_ports": device.open_ports,
                "services": device.services,
                "first_seen": device.first_seen,
                "last_seen": device.last_seen
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Device scan failed for {device_ip}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/device-manager/device/{device_id}",
    tags=["Device Management"]
)
async def get_device(
    device_id: str,
    user=Depends(require_analyst)
):
    """Retrieve information about a discovered device."""
    try:
        device = device_manager.get_device(device_id)
        
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return {
            "status": "success",
            "device": {
                "id": device.id,
                "ip": device.ip,
                "mac": device.mac,
                "hostname": device.hostname,
                "os": device.os,
                "status": device.status,
                "open_ports": device.open_ports,
                "services": device.services,
                "alerts": device.alerts,
                "enrichment": device.enrichment,
                "first_seen": device.first_seen,
                "last_seen": device.last_seen
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving device: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/device-manager/devices",
    tags=["Device Management"]
)
async def list_devices(
    status: str = Query(None, pattern="^(online|offline|suspicious)?$"),
    user=Depends(require_analyst)
):
    """
    List all discovered devices.
    
    **Query Parameters:**
    - status: Filter by device status (online, offline, suspicious)
    """
    try:
        devices = device_manager.list_devices(status_filter=status)
        
        return {
            "status": "success",
            "count": len(devices),
            "devices": [
                {
                    "id": d.id,
                    "ip": d.ip,
                    "mac": d.mac,
                    "hostname": d.hostname,
                    "os": d.os,
                    "status": d.status,
                    "first_seen": d.first_seen,
                    "last_seen": d.last_seen
                }
                for d in devices
            ]
        }
    except Exception as e:
        logger.error(f"Error listing devices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put(
    "/device-manager/device/{device_id}/status",
    tags=["Device Management"]
)
async def update_device_status(
    device_id: str,
    status: str,
    alerts: Optional[list] = None,
    user=Depends(require_analyst)
):
    """
    Update the status of a device and add alerts.
    
    **Args:**
    - device_id: Device identifier
    - status: New status (online, offline, suspicious)
    - alerts: List of alert messages (optional)
    """
    try:
        if status not in ["online", "offline", "suspicious"]:
            raise HTTPException(
                status_code=422,
                detail="Status must be one of: online, offline, suspicious"
            )
        
        device_manager.update_device_status(device_id, status, alerts or [])
        
        return {
            "status": "success",
            "message": f"Device {device_id} status updated to {status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating device status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
