# src/backend/services/device_manager.py

import subprocess
import logging
import json
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, field
from datetime import datetime
import re
import socket

logger = logging.getLogger(__name__)

@dataclass
class Device:
    """Device information model."""
    id: str
    ip: str
    mac: str
    hostname: str
    os: str
    status: str  # online, offline, suspicious
    first_seen: str
    last_seen: str
    open_ports: List[int] = field(default_factory=list)
    services: List[Dict[str, str]] = field(default_factory=list)
    alerts: List[str] = field(default_factory=list)
    enrichment: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.enrichment is None:
            self.enrichment = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ARPScanner:
    """ARP-based device discovery for local network."""
    
    @staticmethod
    async def scan_network(network_range: str = "192.168.1.0/24") -> List[Dict[str, str]]:
        """
        Scan network using ARP requests.
        
        Args:
            network_range: CIDR notation network to scan
            
        Returns:
            List of discovered devices with IP and MAC
        """
        try:
            logger.info(f"Starting ARP scan on {network_range}")
            
            # Use nmap with ARP scan for speed and reliability
            result = await asyncio.to_thread(
                subprocess.run,
                ["nmap", "-PR", "-sn", network_range],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            devices = []
            mac_pattern = r"MAC Address: ([0-9A-F:]+)"
            ip_pattern = r"Nmap scan report for \(?([\d.]+)\)?"
            
            lines = result.stdout.split('\n')
            current_ip = None
            
            for line in lines:
                if "Nmap scan report" in line:
                    ip_match = re.search(ip_pattern, line)
                    if ip_match:
                        current_ip = ip_match.group(1)
                elif "MAC Address" in line and current_ip:
                    mac_match = re.search(mac_pattern, line)
                    if mac_match:
                        devices.append({
                            "ip": current_ip,
                            "mac": mac_match.group(1),
                            "timestamp": datetime.now().isoformat()
                        })
            
            logger.info(f"ARP scan completed: {len(devices)} devices found")
            return devices
            
        except subprocess.TimeoutExpired:
            logger.error(f"ARP scan timed out for {network_range}")
            return []
        except Exception as e:
            logger.error(f"ARP scan failed: {e}")
            return []


class NMAPScanner:
    """NMAP-based advanced device scanning."""
    
    @staticmethod
    async def scan_device(ip: str, scan_type: str = "basic") -> Dict[str, Any]:
        """
        Scan individual device with nmap.
        
        Args:
            ip: IP address to scan
            scan_type: basic, detailed, or aggressive
            
        Returns:
            Device information dictionary
        """
        try:
            # Build nmap command based on scan type
            cmd = ["nmap"]
            
            if scan_type == "basic":
                cmd.extend(["-sn", ip])
            elif scan_type == "detailed":
                cmd.extend(["-sV", "-O", "-p-", ip])
            elif scan_type == "aggressive":
                cmd.extend(["-A", "-T4", "-p-", ip])
            else:
                cmd.extend(["-sn", ip])
            
            logger.info(f"Starting NMAP {scan_type} scan on {ip}")
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            return NMAPScanner._parse_nmap_output(result.stdout, ip)
            
        except subprocess.TimeoutExpired:
            logger.error(f"NMAP scan timed out for {ip}")
            return {"ip": ip, "status": "timeout", "error": "Scan timed out"}
        except Exception as e:
            logger.error(f"NMAP scan failed for {ip}: {e}")
            return {"ip": ip, "status": "error", "error": str(e)}
    
    @staticmethod
    def _parse_nmap_output(output: str, ip: str) -> Dict[str, Any]:
        """Parse nmap output and extract relevant information."""
        device_info = {
            "ip": ip,
            "status": "offline",
            "open_ports": [],
            "services": [],
            "os": "Unknown",
            "hostname": "Unknown"
        }
        
        # Check if host is up
        if "Host is up" in output or "open|filtered" in output:
            device_info["status"] = "online"
        
        # Extract hostname
        hostname_match = re.search(r"Nmap scan report for ([\w\-\.]+)", output)
        if hostname_match:
            hostname = hostname_match.group(1)
            device_info["hostname"] = hostname
        
        # Extract OS information
        os_match = re.search(r"OS: (.+?)(?:\n|$)", output)
        if os_match:
            device_info["os"] = os_match.group(1).strip()
        
        # Extract open ports and services
        port_pattern = r"(\d+)/(\w+)\s+(\w+)\s+(.+?)(?:\n|$)"
        for match in re.finditer(port_pattern, output):
            port = int(match.group(1))
            protocol = match.group(2)
            state = match.group(3)
            service = match.group(4).strip()
            
            if state == "open":
                device_info["open_ports"].append(port)
                device_info["services"].append({
                    "port": port,
                    "protocol": protocol,
                    "service": service
                })
        
        return device_info


class DeviceManager:
    """Comprehensive device discovery and management service."""
    
    def __init__(self):
        self.devices: Dict[str, Device] = {}
        self.arp_scanner = ARPScanner()
        self.nmap_scanner = NMAPScanner()
    
    async def discover_devices(
        self, 
        network_range: str = "192.168.1.0/24",
        detailed_scan: bool = False
    ) -> List[Device]:
        """
        Discover all devices on network.
        
        Args:
            network_range: Network to scan in CIDR notation
            detailed_scan: If True, run detailed NMAP scan on each device
            
        Returns:
            List of discovered Device objects
        """
        try:
            logger.info(f"Starting full device discovery on {network_range}")
            
            # Phase 1: Quick ARP scan
            arp_results = await self.arp_scanner.scan_network(network_range)
            
            devices = []
            
            # Phase 2: Optional detailed scanning
            for result in arp_results:
                device_ip = result["ip"]
                device_mac = result["mac"]
                
                # Get hostname via reverse DNS
                hostname = self._get_hostname(device_ip)
                
                if detailed_scan:
                    # Run NMAP scan
                    nmap_info = await self.nmap_scanner.scan_device(device_ip, "detailed")
                    os_info = nmap_info.get("os", "Unknown")
                    open_ports = nmap_info.get("open_ports", [])
                    services = nmap_info.get("services", [])
                    status = nmap_info.get("status", "offline")
                else:
                    os_info = "Unknown"
                    open_ports = []
                    services = []
                    status = "online"
                
                # Create device object
                device_id = f"dev-{device_mac.replace(':', '')}"
                device = Device(
                    id=device_id,
                    ip=device_ip,
                    mac=device_mac,
                    hostname=hostname,
                    os=os_info,
                    status=status,
                    first_seen=datetime.now().isoformat(),
                    last_seen=datetime.now().isoformat(),
                    open_ports=open_ports,
                    services=services,
                    alerts=[]
                )
                
                # Store and collect
                self.devices[device_id] = device
                devices.append(device)
            
            logger.info(f"Device discovery complete: {len(devices)} devices found")
            return devices
            
        except Exception as e:
            logger.error(f"Device discovery failed: {e}")
            return []
    
    async def scan_device(self, ip: str, scan_type: str = "detailed") -> Optional[Device]:
        """
        Scan a specific device.
        
        Args:
            ip: IP address to scan
            scan_type: Type of scan (basic, detailed, aggressive)
            
        Returns:
            Device object or None if scan fails
        """
        try:
            logger.info(f"Scanning device {ip} with {scan_type} mode")
            
            # Run NMAP scan
            nmap_info = await self.nmap_scanner.scan_device(ip, scan_type)
            
            hostname = self._get_hostname(ip)
            mac = await self._get_mac_from_ip(ip)
            
            device_id = f"dev-{mac.replace(':', '') if mac else ip.replace('.', '')}"
            
            device = Device(
                id=device_id,
                ip=ip,
                mac=mac or "Unknown",
                hostname=hostname,
                os=nmap_info.get("os", "Unknown"),
                status=nmap_info.get("status", "offline"),
                first_seen=datetime.now().isoformat(),
                last_seen=datetime.now().isoformat(),
                open_ports=nmap_info.get("open_ports", []),
                services=nmap_info.get("services", []),
                alerts=[]
            )
            
            self.devices[device_id] = device
            return device
            
        except Exception as e:
            logger.error(f"Device scan failed for {ip}: {e}")
            return None
    
    def get_device(self, device_id: str) -> Optional[Device]:
        """Retrieve device by ID."""
        return self.devices.get(device_id)
    
    def list_devices(self, status_filter: Optional[str] = None) -> List[Device]:
        """
        List all discovered devices.
        
        Args:
            status_filter: Filter by status (online, offline, suspicious)
            
        Returns:
            List of Device objects
        """
        devices = list(self.devices.values())
        
        if status_filter:
            devices = [d for d in devices if d.status == status_filter]
        
        return devices
    
    def update_device_status(self, device_id: str, status: str, alerts: Optional[List[str]] = None):
        """Update device status and alerts."""
        if device_id in self.devices:
            self.devices[device_id].status = status
            self.devices[device_id].last_seen = datetime.now().isoformat()
            if alerts:
                self.devices[device_id].alerts = alerts
    
    @staticmethod
    def _get_hostname(ip: str) -> str:
        """Get hostname via reverse DNS lookup."""
        try:
            hostname = socket.gethostbyaddr(ip)[0]
            return hostname
        except (socket.herror, socket.error):
            return "Unknown"
    
    @staticmethod
    async def _get_mac_from_ip(ip: str) -> Optional[str]:
        """Get MAC address from IP using ARP."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["arp", "-n", ip],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            mac_match = re.search(r"([0-9A-F:]{17})", result.stdout)
            if mac_match:
                return mac_match.group(1)
        except Exception as e:
            logger.debug(f"Failed to get MAC for {ip}: {e}")
        
        return None


# Global instance
device_manager = DeviceManager()
