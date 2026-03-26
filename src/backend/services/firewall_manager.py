# src/backend/services/firewall_manager.py

import subprocess
import logging
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import re

logger = logging.getLogger(__name__)


@dataclass
class FirewallRule:
    """Represents a firewall rule."""
    rule_id: str
    protocol: str  # tcp, udp, all
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    port: Optional[int] = None
    action: str = "drop"  # drop, reject, accept
    description: str = ""
    created_at: str = ""
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()


class IPTablesFirewall:
    """iptables-based firewall management (Linux)."""
    
    @staticmethod
    async def check_available() -> bool:
        """Check if iptables is available."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["which", "iptables"],
                capture_output=True
            )
            return result.returncode == 0
        except Exception:
            return False
    
    @staticmethod
    async def block_ip(ip: str, protocol: str = "all") -> bool:
        """
        Block traffic from an IP address.
        
        Args:
            ip: IP address to block
            protocol: Protocol to block (tcp, udp, all)
        """
        try:
            if protocol == "all":
                cmd = ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"]
            else:
                cmd = ["iptables", "-A", "INPUT", "-p", protocol, "-s", ip, "-j", "DROP"]
            
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Blocked IP {ip} ({protocol})")
            return True
        except Exception as e:
            logger.error(f"Failed to block IP: {e}")
            return False
    
    @staticmethod
    async def unblock_ip(ip: str, protocol: str = "all") -> bool:
        """Unblock an IP address."""
        try:
            if protocol == "all":
                cmd = ["iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"]
            else:
                cmd = ["iptables", "-D", "INPUT", "-p", protocol, "-s", ip, "-j", "DROP"]
            
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Unblocked IP {ip} ({protocol})")
            return True
        except Exception as e:
            logger.error(f"Failed to unblock IP: {e}")
            return False
    
    @staticmethod
    async def block_port(port: int, protocol: str = "tcp") -> bool:
        """Block incoming traffic on a port."""
        try:
            cmd = ["iptables", "-A", "INPUT", "-p", protocol, "--dport", str(port), "-j", "DROP"]
            
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Blocked port {port} ({protocol})")
            return True
        except Exception as e:
            logger.error(f"Failed to block port: {e}")
            return False
    
    @staticmethod
    async def allow_ip(ip: str, protocol: str = "all") -> bool:
        """Allow traffic from an IP address."""
        try:
            if protocol == "all":
                cmd = ["iptables", "-A", "INPUT", "-s", ip, "-j", "ACCEPT"]
            else:
                cmd = ["iptables", "-A", "INPUT", "-p", protocol, "-s", ip, "-j", "ACCEPT"]
            
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Allowed IP {ip} ({protocol})")
            return True
        except Exception as e:
            logger.error(f"Failed to allow IP: {e}")
            return False
    
    @staticmethod
    async def list_rules() -> List[str]:
        """List all iptables rules."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables", "-L", "-n"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr}")
                return []
            
            return result.stdout.split('\n')
        except Exception as e:
            logger.error(f"Failed to list rules: {e}")
            return []
    
    @staticmethod
    async def flush_all_rules() -> bool:
        """Flush all rules (dangerous operation)."""
        try:
            logger.warning("Flushing all firewall rules")
            
            cmd = ["iptables", "-F"]
            result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True)
            
            if result.returncode != 0:
                logger.error(f"iptables error: {result.stderr.decode()}")
                return False
            
            logger.info("All firewall rules flushed")
            return True
        except Exception as e:
            logger.error(f"Failed to flush rules: {e}")
            return False
    
    @staticmethod
    async def save_rules() -> bool:
        """Save firewall rules to disk (persists after restart)."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables-save"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"iptables-save error: {result.stderr}")
                return False
            
            logger.info("Firewall rules saved")
            return True
        except Exception as e:
            logger.error(f"Failed to save rules: {e}")
            return False


class UFWFirewall:
    """UFW-based firewall management (Linux wrapper around iptables)."""
    
    @staticmethod
    async def check_available() -> bool:
        """Check if UFW is available."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["which", "ufw"],
                capture_output=True
            )
            return result.returncode == 0
        except Exception:
            return False
    
    @staticmethod
    async def enable() -> bool:
        """Enable UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "enable"],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info("UFW enabled")
            return True
        except Exception as e:
            logger.error(f"Failed to enable UFW: {e}")
            return False
    
    @staticmethod
    async def disable() -> bool:
        """Disable UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "disable"],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info("UFW disabled")
            return True
        except Exception as e:
            logger.error(f"Failed to disable UFW: {e}")
            return False
    
    @staticmethod
    async def block_ip(ip: str) -> bool:
        """Block an IP address using UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "deny", "from", ip],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Blocked IP {ip} via UFW")
            return True
        except Exception as e:
            logger.error(f"Failed to block IP: {e}")
            return False
    
    @staticmethod
    async def allow_ip(ip: str) -> bool:
        """Allow an IP address using UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "allow", "from", ip],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Allowed IP {ip} via UFW")
            return True
        except Exception as e:
            logger.error(f"Failed to allow IP: {e}")
            return False
    
    @staticmethod
    async def allow_port(port: int, protocol: str = "tcp") -> bool:
        """Allow a port using UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "allow", f"{port}/{protocol}"],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Allowed port {port}/{protocol} via UFW")
            return True
        except Exception as e:
            logger.error(f"Failed to allow port: {e}")
            return False
    
    @staticmethod
    async def deny_port(port: int, protocol: str = "tcp") -> bool:
        """Deny a port using UFW."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "deny", f"{port}/{protocol}"],
                capture_output=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr.decode()}")
                return False
            
            logger.info(f"Denied port {port}/{protocol} via UFW")
            return True
        except Exception as e:
            logger.error(f"Failed to deny port: {e}")
            return False
    
    @staticmethod
    async def list_rules() -> List[str]:
        """List all UFW rules."""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["ufw", "status", "numbered"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"ufw error: {result.stderr}")
                return []
            
            return result.stdout.split('\n')
        except Exception as e:
            logger.error(f"Failed to list rules: {e}")
            return []


class FirewallManager:
    """
    Unified firewall manager supporting both iptables and UFW.
    Automatically detects and uses the most suitable backend.
    """
    
    def __init__(self):
        self.backend: Optional[str] = None
        self.iptables = IPTablesFirewall()
        self.ufw = UFWFirewall()
        self.rules_log: List[Dict[str, Any]] = []
    
    async def initialize(self):
        """Detect available firewall backend."""
        if await self.ufw.check_available():
            self.backend = "ufw"
            logger.info("Using UFW as firewall backend")
        elif await self.iptables.check_available():
            self.backend = "iptables"
            logger.info("Using iptables as firewall backend")
        else:
            logger.warning("No firewall backend available")
            self.backend = None
    
    async def block_ip(
        self,
        ip: str,
        protocol: str = "all",
        description: str = ""
    ) -> bool:
        """Block an IP address."""
        if not self.backend:
            logger.error("No firewall backend available")
            return False
        
        success = False
        if self.backend == "ufw":
            success = await self.ufw.block_ip(ip)
        else:
            success = await self.iptables.block_ip(ip, protocol)
        
        if success:
            self.rules_log.append({
                "action": "block",
                "target": ip,
                "protocol": protocol,
                "backend": self.backend,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def allow_ip(self, ip: str, description: str = "") -> bool:
        """Allow an IP address."""
        if not self.backend:
            logger.error("No firewall backend available")
            return False
        
        success = False
        if self.backend == "ufw":
            success = await self.ufw.allow_ip(ip)
        else:
            success = await self.iptables.allow_ip(ip)
        
        if success:
            self.rules_log.append({
                "action": "allow",
                "target": ip,
                "backend": self.backend,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def block_port(
        self,
        port: int,
        protocol: str = "tcp",
        description: str = ""
    ) -> bool:
        """Block a port."""
        if not self.backend:
            logger.error("No firewall backend available")
            return False
        
        success = False
        if self.backend == "ufw":
            success = await self.ufw.deny_port(port, protocol)
        else:
            success = await self.iptables.block_port(port, protocol)
        
        if success:
            self.rules_log.append({
                "action": "block_port",
                "target": f"{port}/{protocol}",
                "backend": self.backend,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def allow_port(
        self,
        port: int,
        protocol: str = "tcp",
        description: str = ""
    ) -> bool:
        """Allow a port."""
        if not self.backend:
            logger.error("No firewall backend available")
            return False
        
        success = False
        if self.backend == "ufw":
            success = await self.ufw.allow_port(port, protocol)
        else:
            success = await self.iptables.allow_ip(f"0/0", protocol)
        
        if success:
            self.rules_log.append({
                "action": "allow_port",
                "target": f"{port}/{protocol}",
                "backend": self.backend,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def list_rules(self) -> List[str]:
        """List all firewall rules."""
        if not self.backend:
            logger.error("No firewall backend available")
            return []
        
        if self.backend == "ufw":
            return await self.ufw.list_rules()
        else:
            return await self.iptables.list_rules()
    
    def get_rules_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get rule application history."""
        return self.rules_log[-limit:]
    
    def get_backend_info(self) -> Dict[str, Any]:
        """Get firewall backend information."""
        return {
            "backend": self.backend,
            "available": self.backend is not None,
            "rules_applied": len(self.rules_log)
        }


# Global instance
firewall_manager = FirewallManager()
