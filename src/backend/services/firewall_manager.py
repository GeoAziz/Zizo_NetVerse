# src/backend/services/firewall_manager.py

"""
Firewall Manager with abstraction layer support.
Implements dependency injection for multiple firewall providers.
Supports iptables (Linux), and cloud providers (AWS, GCP, Azure).
"""

import logging
import asyncio
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Import the abstraction layer
from .firewall_base import (
    FirewallProviderBase,
    FirewallRule,
    DeviceIsolationConfig,
    ProviderCapabilities
)

# Import concrete providers
from .firewall_iptables import IPTablesFirewallProvider
from .firewall_cloud import (
    AWSSecurityGroupProvider,
    GCPVPCFirewallProvider,
    AzureNetworkSecurityGroupProvider
)


class FirewallManager:
    """
    Unified firewall manager with abstraction layer support.
    Implements dependency injection for provider-agnostic firewall operations.
    Supports multiple providers with automatic fallback and health monitoring.
    """
    
    def __init__(self):
        self.provider: Optional[FirewallProviderBase] = None
        self.backup_providers: List[FirewallProviderBase] = []
        self.rules_log: List[Dict[str, Any]] = []
        self.provider_name: Optional[str] = None
    
    async def initialize(self):
        """
        Initialize the firewall manager with the appropriate provider.
        
        Provider selection order (based on FIREWALL_PROVIDER env var):
        1. iptables (default for Linux) 
        2. aws_security_group
        3. gcp_vpc_firewall
        4. azure_nsg
        
        Falls back to next available provider if initialization fails.
        """
        firewall_provider = os.getenv("FIREWALL_PROVIDER", "iptables").lower().strip()
        
        logger.info(f"Initializing firewall manager with provider: {firewall_provider}")
        
        # Define provider initialization order
        providers_to_try = []
        
        if firewall_provider == "iptables":
            providers_to_try = [self._init_iptables]
        elif firewall_provider == "aws_security_group":
            providers_to_try = [
                self._init_aws,
                self._init_iptables  # Fallback
            ]
        elif firewall_provider == "gcp_vpc_firewall":
            providers_to_try = [
                self._init_gcp,
                self._init_iptables  # Fallback
            ]
        elif firewall_provider == "azure_nsg":
            providers_to_try = [
                self._init_azure,
                self._init_iptables  # Fallback
            ]
        else:
            logger.warning(
                f"Unknown FIREWALL_PROVIDER: {firewall_provider}. "
                f"Trying iptables as default."
            )
            providers_to_try = [
                self._init_iptables,
                self._init_aws,
                self._init_gcp,
                self._init_azure
            ]
        
        # Try each provider in order
        for init_func in providers_to_try:
            try:
                provider = await init_func()
                if provider and await provider.initialize():
                    self.provider = provider
                    self.provider_name = provider.provider_name
                    logger.info(f"✅ Firewall manager initialized with {provider.provider_name}")
                    return
            except Exception as e:
                logger.warning(f"Failed to initialize provider via {init_func.__name__}: {e}")
                continue
        
        logger.error("❌ Failed to initialize any firewall provider")
        self.provider = None
        self.provider_name = None
    
    async def _init_iptables(self) -> Optional[FirewallProviderBase]:
        """Initialize iptables provider."""
        logger.debug("Attempting to initialize iptables provider...")
        provider = IPTablesFirewallProvider()
        return provider if await provider.initialize() else None
    
    async def _init_aws(self) -> Optional[FirewallProviderBase]:
        """Initialize AWS Security Group provider."""
        logger.debug("Attempting to initialize AWS Security Group provider...")
        try:
            sg_id = os.getenv("AWS_SECURITY_GROUP_ID")
            region = os.getenv("AWS_REGION", "us-east-1")
            vpc_id = os.getenv("AWS_VPC_ID")
            
            if not sg_id:
                logger.warning("AWS_SECURITY_GROUP_ID not set, skipping AWS provider")
                return None
            
            provider = AWSSecurityGroupProvider(
                security_group_id=sg_id,
                region=region,
                vpc_id=vpc_id
            )
            return provider
        except Exception as e:
            logger.warning(f"Cannot initialize AWS provider: {e}")
            return None
    
    async def _init_gcp(self) -> Optional[FirewallProviderBase]:
        """Initialize GCP VPC Firewall provider."""
        logger.debug("Attempting to initialize GCP VPC Firewall provider...")
        try:
            project_id = os.getenv("GCP_PROJECT_ID")
            
            if not project_id:
                logger.warning("GCP_PROJECT_ID not set, skipping GCP provider")
                return None
            
            provider = GCPVPCFirewallProvider(project_id=project_id)
            return provider
        except Exception as e:
            logger.warning(f"Cannot initialize GCP provider: {e}")
            return None
    
    async def _init_azure(self) -> Optional[FirewallProviderBase]:
        """Initialize Azure NSG provider."""
        logger.debug("Attempting to initialize Azure NSG provider...")
        try:
            resource_group = os.getenv("AZURE_RESOURCE_GROUP")
            nsg_name = os.getenv("AZURE_NSG_NAME")
            subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
            
            if not all([resource_group, nsg_name, subscription_id]):
                logger.warning("Azure credentials not fully set, skipping Azure provider")
                return None
            
            provider = AzureNetworkSecurityGroupProvider(
                resource_group_name=resource_group,
                nsg_name=nsg_name,
                subscription_id=subscription_id
            )
            return provider
        except Exception as e:
            logger.warning(f"Cannot initialize Azure provider: {e}")
            return None
    
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
            description: Optional description
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        success = await self.provider.block_ip(ip, protocol, description)
        
        if success:
            self.rules_log.append({
                "action": "block_ip",
                "target": ip,
                "protocol": protocol,
                "provider": self.provider_name,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
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
            description: Optional description
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        success = await self.provider.allow_ip(ip, protocol, port, description)
        
        if success:
            self.rules_log.append({
                "action": "allow_ip",
                "target": ip,
                "protocol": protocol,
                "port": port,
                "provider": self.provider_name,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
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
            description: Optional description
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        success = await self.provider.block_port(port, protocol, source_ip, description)
        
        if success:
            self.rules_log.append({
                "action": "block_port",
                "target": f"{port}/{protocol}",
                "source_ip": source_ip,
                "provider": self.provider_name,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
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
            description: Optional description
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        success = await self.provider.allow_port(port, protocol, source_ip, description)
        
        if success:
            self.rules_log.append({
                "action": "allow_port",
                "target": f"{port}/{protocol}",
                "source_ip": source_ip,
                "provider": self.provider_name,
                "description": description,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def isolate_device(
        self,
        device_ip: str,
        mac_address: Optional[str] = None,
        reason: str = ""
    ) -> bool:
        """
        Isolate a device from network traffic.
        
        Args:
            device_ip: IP address of device to isolate
            mac_address: Optional MAC address
            reason: Reason for isolation
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        config = DeviceIsolationConfig(
            device_ip=device_ip,
            mac_address=mac_address,
            reason=reason
        )
        
        success = await self.provider.isolate_device(config)
        
        if success:
            self.rules_log.append({
                "action": "isolate_device",
                "target": device_ip,
                "mac_address": mac_address,
                "reason": reason,
                "provider": self.provider_name,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def unisolate_device(self, device_ip: str) -> bool:
        """
        Remove device isolation.
        
        Args:
            device_ip: IP address of device to unisolate
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        success = await self.provider.unisolate_device(device_ip)
        
        if success:
            self.rules_log.append({
                "action": "unisolate_device",
                "target": device_ip,
                "provider": self.provider_name,
                "timestamp": datetime.now().isoformat()
            })
        
        return success
    
    async def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a specific firewall rule.
        
        Args:
            rule_id: ID of the rule to delete
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        return await self.provider.delete_rule(rule_id)
    
    async def list_rules(self) -> List[FirewallRule]:
        """
        List all active firewall rules.
        
        Returns:
            List[FirewallRule]: List of active rules
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return []
        
        return await self.provider.list_rules()
    
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """
        Flush all rules or rules from a specific chain.
        
        Args:
            chain: Chain to flush (INPUT, OUTPUT, FORWARD) or None for all
            
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        logger.warning(f"Flushing firewall rules (chain: {chain or 'all'})")
        return await self.provider.flush_rules(chain)
    
    async def save_rules(self) -> bool:
        """
        Persist firewall rules to disk (if supported by provider).
        
        Returns:
            bool: Success status
        """
        if not self.provider:
            logger.error("No firewall provider available")
            return False
        
        return await self.provider.save_rules()
    
    def get_rules_log(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get rule application history.
        
        Args:
            limit: Maximum number of log entries to return
            
        Returns:
            List of recent rule application logs
        """
        return self.rules_log[-limit:]
    
    def get_backend_info(self) -> Dict[str, Any]:
        """
        Get firewall backend information and capabilities.
        
        Returns:
            Dict with backend info and capabilities
        """
        if not self.provider:
            return {
                "backend": None,
                "available": False,
                "initialized": False,
                "rules_applied": len(self.rules_log)
            }
        
        capabilities = self.provider.get_capabilities()
        
        return {
            "backend": self.provider_name,
            "available": True,
            "initialized": self.provider.initialized,
            "rules_applied": len(self.rules_log),
            "capabilities": {
                "supports_block_ip": capabilities.supports_block_ip,
                "supports_allow_ip": capabilities.supports_allow_ip,
                "supports_block_port": capabilities.supports_block_port,
                "supports_allow_port": capabilities.supports_allow_port,
                "supports_device_isolation": capabilities.supports_device_isolation,
                "supports_mac_filtering": capabilities.supports_mac_filtering,
                "supports_vlan": capabilities.supports_vlan,
                "supports_rule_persistence": capabilities.supports_rule_persistence,
                "supports_rule_scheduling": capabilities.supports_rule_scheduling,
                "supports_logging": capabilities.supports_logging,
            }
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the current provider.
        
        Returns:
            Dict with health status
        """
        if not self.provider:
            return {
                "status": "unhealthy",
                "backend": None,
                "message": "No firewall provider initialized"
            }
        
        return await self.provider.health_check()
    
    async def shutdown(self):
        """Clean shutdown of the firewall manager."""
        if self.provider:
            await self.provider.shutdown()
            logger.info("Firewall manager shutdown complete")


# Global instance
firewall_manager = FirewallManager()
