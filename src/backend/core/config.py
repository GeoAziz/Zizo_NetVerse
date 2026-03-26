# src/backend/core/config.py

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import socket
from pathlib import Path


def _get_primary_network_interface() -> str:
    """
    Auto-detect the primary network interface on the system.
    
    Attempts multiple detection methods:
    1. Check IP_DEFAULT_INTERFACE environment variable
    2. Use socket to find default route
    3. Read from system configuration
    4. Fallback to common interface names
    
    Returns:
        str: Network interface name or fallback
    """
    # Check environment variable first
    env_interface = os.getenv("NETWORK_INTERFACE")
    if env_interface:
        return env_interface
    
    # Try socket-based detection
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        interface_name = socket.if_indextoname(socket.if_nametoindex(s.getsockname()[0]))
        s.close()
        return interface_name
    except Exception:
        pass
    
    # Try reading from route table (Linux)
    try:
        with open('/proc/net/route', 'r') as f:
            lines = f.readlines()
            for line in lines[1:]:  # Skip header
                parts = line.split()
                if parts[1] == '00000000':  # Default route
                    return parts[0]
    except Exception:
        pass
    
    # Fallback to common interface names
    common_interfaces = [
        'eth0', 'eth1',           # Ethernet
        'enp0s3', 'enp0s31f6',    # PCI-named Ethernet
        'wlan0', 'wlan1',         # Wireless
        'en0', 'en1',             # macOS
        'em0', 'em1',             # FreeBSD
    ]
    
    for iface in common_interfaces:
        try:
            socket.if_nametoindex(iface)
            return iface
        except OSError:
            continue
    
    # Last resort
    return "eth0"


class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "Zizo_NetVerse"
    API_V1_STR: str = "/api/v1"

    # API Keys & Secrets - Made optional to prevent crashing on startup
    GEMINI_API_KEY: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    # New variable for cloud environments to hold the entire JSON content
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None
    
    # InfluxDB Configuration
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "your-influxdb-token-here"
    INFLUXDB_ORG: str = "zizo-netverse"
    INFLUXDB_BUCKET: str = "network_logs"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    # Network Capture Configuration
    NETWORK_INTERFACE: str = _get_primary_network_interface()
    CAPTURE_ENABLED: bool = True
    
    # CORS Origins (comma-separated string)
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:9002"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    class Config:
        # Resolve env files in priority order:
        # 1) src/backend/.env (backend-local)
        # 2) project-root/.env
        _this_file = Path(__file__).resolve()
        _backend_dir = _this_file.parent.parent
        _project_root = _this_file.parent.parent.parent.parent
        env_file = (
            str(_backend_dir / ".env"),
            str(_project_root / ".env"),
        )
        env_file_encoding = "utf-8"
        # Allow extra fields for flexibility
        extra = "allow"

# Create global settings instance
settings = Settings()
