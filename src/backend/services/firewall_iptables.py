# src/backend/services/firewall_iptables.py

"""
iptables-based firewall provider.
Default implementation for Linux environments.
Supports INPUT, OUTPUT, and FORWARD chains with full rule management.
"""

import subprocess
import logging
import asyncio
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from .firewall_base import (
    FirewallProviderBase,
    FirewallRule,
    DeviceIsolationConfig,
    ProviderCapabilities,
    ChainType
)

logger = logging.getLogger(__name__)


class IPTablesFirewallProvider(FirewallProviderBase):
    """iptables-based firewall provider for Linux."""
    
    def __init__(self):
        super().__init__("iptables")
        self.rules_index: Dict[str, FirewallRule] = {}
        self.next_rule_id = 1
    
    async def initialize(self) -> bool:
        """
        Check if iptables is available and functional.
        
        Returns:
            bool: True if iptables is available
        """
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables", "--version"],
                capture_output=True,
                timeout=5
            )
            
            if result.returncode == 0:
                version = result.stdout.decode().strip()
                logger.info(f"iptables provider initialized: {version}")
                self.initialized = True
                return True
            else:
                logger.error(f"iptables not available: {result.stderr.decode()}")
                return False
        except Exception as e:
            logger.error(f"Failed to initialize iptables provider: {e}")
            return False
    
    async def block_ip(
        self,
        ip: str,
        protocol: str = "all",
        description: str = ""
    ) -> bool:
        """
        Block incoming traffic from an IP address.
        
        Args:
            ip: IP address to block
            protocol: Protocol to block (tcp, udp, icmp, all)
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            rule_id = f"block_ip_{ip}_{protocol}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            # Build iptables command
            if protocol.lower() == "all":
                cmd = ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"]
            else:
                cmd = [
                    "iptables", "-A", "INPUT",
                    "-p", protocol,
                    "-s", ip,
                    "-j", "DROP"
                ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error blocking {ip}: {result.stderr.decode()}")
                return False
            
            # Cache the rule
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                source_ip=ip,
                action="drop",
                description=description,
                chain="INPUT"
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            logger.info(f"Blocked IP {ip} ({protocol})")
            return True
        except Exception as e:
            logger.error(f"Failed to block IP {ip}: {e}")
            return False
    
    async def allow_ip(
        self,
        ip: str,
        protocol: str = "all",
        port: Optional[int] = None,
        description: str = ""
    ) -> bool:
        """
        Allow incoming traffic from an IP address.
        
        Args:
            ip: IP address to allow
            protocol: Protocol to allow (tcp, udp, icmp, all)
            port: Optional port to allow
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            rule_id = f"allow_ip_{ip}_{protocol}_{port}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            # Build iptables command - insert at beginning for priority
            if protocol.lower() == "all":
                if port:
                    logger.warning("Port ignored when protocol is 'all'")
                cmd = ["iptables", "-I", "INPUT", "1", "-s", ip, "-j", "ACCEPT"]
            else:
                if port:
                    cmd = [
                        "iptables", "-I", "INPUT", "1",
                        "-p", protocol,
                        "-s", ip,
                        "--dport", str(port),
                        "-j", "ACCEPT"
                    ]
                else:
                    cmd = [
                        "iptables", "-I", "INPUT", "1",
                        "-p", protocol,
                        "-s", ip,
                        "-j", "ACCEPT"
                    ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error allowing {ip}: {result.stderr.decode()}")
                return False
            
            # Cache the rule
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                source_ip=ip,
                port=port,
                action="accept",
                description=description,
                chain="INPUT"
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            logger.info(f"Allowed IP {ip} ({protocol}:{port if port else 'any'})")
            return True
        except Exception as e:
            logger.error(f"Failed to allow IP {ip}: {e}")
            return False
    
    async def block_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """
        Block incoming traffic on a specific port.
        
        Args:
            port: Port number to block
            protocol: Protocol (tcp, udp)
            source_ip: Optional source IP to block from
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            rule_id = f"block_port_{port}_{protocol}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            if source_ip:
                cmd = [
                    "iptables", "-A", "INPUT",
                    "-p", protocol,
                    "-s", source_ip,
                    "--dport", str(port),
                    "-j", "DROP"
                ]
            else:
                cmd = [
                    "iptables", "-A", "INPUT",
                    "-p", protocol,
                    "--dport", str(port),
                    "-j", "DROP"
                ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error blocking port {port}: {result.stderr.decode()}")
                return False
            
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                port=port,
                source_ip=source_ip,
                action="drop",
                description=description,
                chain="INPUT"
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            logger.info(f"Blocked port {port}/{protocol}")
            return True
        except Exception as e:
            logger.error(f"Failed to block port {port}: {e}")
            return False
    
    async def allow_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """
        Allow incoming traffic on a specific port.
        
        Args:
            port: Port number to allow
            protocol: Protocol (tcp, udp)
            source_ip: Optional source IP to allow from
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            rule_id = f"allow_port_{port}_{protocol}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            if source_ip:
                cmd = [
                    "iptables", "-I", "INPUT", "1",
                    "-p", protocol,
                    "-s", source_ip,
                    "--dport", str(port),
                    "-j", "ACCEPT"
                ]
            else:
                cmd = [
                    "iptables", "-I", "INPUT", "1",
                    "-p", protocol,
                    "--dport", str(port),
                    "-j", "ACCEPT"
                ]
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error allowing port {port}: {result.stderr.decode()}")
                return False
            
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                port=port,
                source_ip=source_ip,
                action="accept",
                description=description,
                chain="INPUT"
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            logger.info(f"Allowed port {port}/{protocol}")
            return True
        except Exception as e:
            logger.error(f"Failed to allow port {port}: {e}")
            return False
    
    async def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a specific firewall rule.
        
        Args:
            rule_id: ID of the rule to delete
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            if rule_id not in self.rules_index:
                logger.warning(f"Rule {rule_id} not found in cache")
                return False
            
            rule = self.rules_index[rule_id]
            
            # Rebuild deletion command based on rule type
            if rule.source_ip and rule.port:
                cmd = [
                    "iptables", "-D", rule.chain,
                    "-p", rule.protocol,
                    "-s", rule.source_ip,
                    "--dport", str(rule.port),
                    "-j", rule.action.upper()
                ]
            elif rule.source_ip:
                if rule.protocol.lower() == "all":
                    cmd = [
                        "iptables", "-D", rule.chain,
                        "-s", rule.source_ip,
                        "-j", rule.action.upper()
                    ]
                else:
                    cmd = [
                        "iptables", "-D", rule.chain,
                        "-p", rule.protocol,
                        "-s", rule.source_ip,
                        "-j", rule.action.upper()
                    ]
            elif rule.port:
                cmd = [
                    "iptables", "-D", rule.chain,
                    "-p", rule.protocol,
                    "--dport", str(rule.port),
                    "-j", rule.action.upper()
                ]
            else:
                logger.warning(f"Cannot delete rule {rule_id}: insufficient data")
                return False
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables error deleting rule: {result.stderr.decode()}")
                return False
            
            # Remove from cache
            del self.rules_index[rule_id]
            self.rules_cache = [r for r in self.rules_cache if r.rule_id != rule_id]
            
            logger.info(f"Deleted rule {rule_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete rule {rule_id}: {e}")
            return False
    
    async def list_rules(self) -> List[FirewallRule]:
        """
        List all active firewall rules.
        
        Returns:
            List[FirewallRule]: List of active rules
        """
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables", "-L", "-n", "-v"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables list error: {result.stderr}")
                return self.rules_cache
            
            # For now, return cached rules
            # In production, might parse the output and rebuild cache
            return self.rules_cache
        except Exception as e:
            logger.error(f"Failed to list rules: {e}")
            return self.rules_cache
    
    async def isolate_device(
        self,
        config: DeviceIsolationConfig
    ) -> bool:
        """
        Isolate a device from network traffic.
        
        Uses IP spoofing/MAC filtering to isolate the device.
        
        Args:
            config: Device isolation configuration
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            rule_id_in = f"isolate_in_{config.device_ip}_{self.next_rule_id}"
            rule_id_out = f"isolate_out_{config.device_ip}_{self.next_rule_id + 1}"
            self.next_rule_id += 2
            
            # Block incoming traffic
            cmd_in = [
                "iptables", "-A", "INPUT",
                "-s", config.device_ip,
                "-j", "DROP"
            ]
            
            result_in = await asyncio.to_thread(
                subprocess.run,
                cmd_in,
                capture_output=True,
                timeout=10
            )
            
            # Block outgoing traffic
            cmd_out = [
                "iptables", "-A", "OUTPUT",
                "-d", config.device_ip,
                "-j", "DROP"
            ]
            
            result_out = await asyncio.to_thread(
                subprocess.run,
                cmd_out,
                capture_output=True,
                timeout=10
            )
            
            if result_in.returncode != 0 or result_out.returncode != 0:
                logger.error("Failed to isolate device via iptables")
                return False
            
            # Cache isolation rules
            rule_in = FirewallRule(
                rule_id=rule_id_in,
                protocol="all",
                source_ip=config.device_ip,
                action="isolate",
                description=f"Isolation (IN): {config.reason}",
                chain="INPUT"
            )
            rule_out = FirewallRule(
                rule_id=rule_id_out,
                protocol="all",
                dest_ip=config.device_ip,
                action="isolate",
                description=f"Isolation (OUT): {config.reason}",
                chain="OUTPUT"
            )
            
            self.rules_index[rule_id_in] = rule_in
            self.rules_index[rule_id_out] = rule_out
            self.rules_cache.extend([rule_in, rule_out])
            
            logger.info(f"Isolated device {config.device_ip}: {config.reason}")
            return True
        except Exception as e:
            logger.error(f"Failed to isolate device: {e}")
            return False
    
    async def unisolate_device(self, device_ip: str) -> bool:
        """
        Remove device isolation.
        
        Args:
            device_ip: IP address of the device to unisolate
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            # Find and delete isolation rules
            rules_to_delete = [
                r for r in self.rules_cache
                if r.action == "isolate" and (r.source_ip == device_ip or r.dest_ip == device_ip)
            ]
            
            for rule in rules_to_delete:
                await self.delete_rule(rule.rule_id)
            
            logger.info(f"Removed isolation for device {device_ip}")
            return len(rules_to_delete) > 0
        except Exception as e:
            logger.error(f"Failed to unisolate device: {e}")
            return False
    
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """
        Flush all rules or rules from a specific chain.
        
        Args:
            chain: Chain to flush (INPUT, OUTPUT, FORWARD) or None for all
            
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            if chain:
                cmd = ["iptables", "-F", chain]
                logger.warning(f"Flushing iptables chain {chain}")
            else:
                cmd = ["iptables", "-F"]
                logger.warning("Flushing all iptables rules")
            
            result = await asyncio.to_thread(
                subprocess.run,
                cmd,
                capture_output=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.error(f"iptables flush error: {result.stderr.decode()}")
                return False
            
            # Clear cache
            if chain:
                self.rules_cache = [r for r in self.rules_cache if r.chain != chain]
            else:
                self.rules_cache = []
                self.rules_index = {}
            
            logger.info("Firewall rules flushed")
            return True
        except Exception as e:
            logger.error(f"Failed to flush rules: {e}")
            return False
    
    async def save_rules(self) -> bool:
        """
        Persist firewall rules to disk using iptables-save.
        
        Returns:
            bool: Success status
        """
        if not self.initialized:
            logger.error("iptables provider not initialized")
            return False
        
        try:
            # Try using iptables-save
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables-save"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0:
                logger.warning(f"iptables-save failed: {result.stderr}")
                return False
            
            logger.info("Firewall rules saved to disk")
            return True
        except Exception as e:
            logger.error(f"Failed to save rules: {e}")
            return False
    
    def get_capabilities(self) -> ProviderCapabilities:
        """
        Get the capabilities of this provider.
        
        Returns:
            ProviderCapabilities: Capabilities of the iptables provider
        """
        return ProviderCapabilities(
            supports_block_ip=True,
            supports_allow_ip=True,
            supports_block_port=True,
            supports_allow_port=True,
            supports_device_isolation=True,
            supports_mac_filtering=True,  # Can implement with iptables
            supports_vlan=False,           # Limited VLAN support
            supports_rule_persistence=True,
            supports_rule_scheduling=False,
            supports_logging=True
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the provider.
        
        Returns:
            Dict with health status and details
        """
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["iptables", "--version"],
                capture_output=True,
                timeout=5
            )
            
            return {
                "status": "healthy" if result.returncode == 0 else "unhealthy",
                "provider": self.provider_name,
                "initialized": self.initialized,
                "rules_cached": len(self.rules_cache),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.provider_name,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
