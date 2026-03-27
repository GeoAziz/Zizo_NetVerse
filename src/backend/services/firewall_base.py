# src/backend/services/firewall_base.py

"""
Abstract base class for firewall operations.
Defines the interface that all firewall providers must implement.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime


class ActionType(Enum):
    """Firewall action types."""
    ACCEPT = "accept"
    DROP = "drop"
    REJECT = "reject"
    ISOLATE = "isolate"


class ProtocolType(Enum):
    """Protocol types."""
    TCP = "tcp"
    UDP = "udp"
    ICMP = "icmp"
    ALL = "all"


class ChainType(Enum):
    """iptables chain types."""
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    FORWARD = "FORWARD"


@dataclass
class FirewallRule:
    """Represents a firewall rule."""
    rule_id: str
    protocol: str  # tcp, udp, icmp, all
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    port: Optional[int] = None
    action: str = "drop"  # drop, reject, accept, isolate
    description: str = ""
    chain: Optional[str] = None  # INPUT, OUTPUT, FORWARD
    created_at: str = ""
    extra_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if self.extra_data is None:
            self.extra_data = {}


@dataclass
class DeviceIsolationConfig:
    """Configuration for device isolation."""
    device_ip: str
    mac_address: Optional[str] = None
    vlan_id: Optional[int] = None
    reason: str = ""
    isolation_type: str = "full"  # full, partial, quarantine


@dataclass
class ProviderCapabilities:
    """Describes what a provider can do."""
    supports_block_ip: bool = False
    supports_allow_ip: bool = False
    supports_block_port: bool = False
    supports_allow_port: bool = False
    supports_device_isolation: bool = False
    supports_mac_filtering: bool = False
    supports_vlan: bool = False
    supports_rule_persistence: bool = False
    supports_rule_scheduling: bool = False
    supports_logging: bool = False


class FirewallProviderBase(ABC):
    """
    Abstract base class for firewall providers.
    All firewall implementations must inherit from this class.
    """
    
    def __init__(self, provider_name: str):
        """
        Initialize firewall provider.
        
        Args:
            provider_name: Name of the provider (e.g., 'iptables', 'pf', 'aws_sg')
        """
        self.provider_name = provider_name
        self.initialized = False
        self.rules_cache: List[FirewallRule] = []
    
    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize and verify firewall provider availability.
        
        Returns:
            bool: True if provider is available and initialized
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a specific firewall rule.
        
        Args:
            rule_id: ID of the rule to delete
            
        Returns:
            bool: Success status
        """
        pass
    
    @abstractmethod
    async def list_rules(self) -> List[FirewallRule]:
        """
        List all active firewall rules.
        
        Returns:
            List[FirewallRule]: List of active rules
        """
        pass
    
    @abstractmethod
    async def isolate_device(
        self,
        config: DeviceIsolationConfig
    ) -> bool:
        """
        Isolate a device from network traffic.
        
        Args:
            config: Device isolation configuration
            
        Returns:
            bool: Success status
        """
        pass
    
    @abstractmethod
    async def unisolate_device(self, device_ip: str) -> bool:
        """
        Remove device isolation.
        
        Args:
            device_ip: IP address of the device to unisolate
            
        Returns:
            bool: Success status
        """
        pass
    
    @abstractmethod
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """
        Flush all rules or rules from a specific chain.
        
        Args:
            chain: Chain to flush (INPUT, OUTPUT, FORWARD) or None for all
            
        Returns:
            bool: Success status
        """
        pass
    
    @abstractmethod
    async def save_rules(self) -> bool:
        """
        Persist firewall rules to disk (if supported).
        
        Returns:
            bool: Success status
        """
        pass
    
    @abstractmethod
    def get_capabilities(self) -> ProviderCapabilities:
        """
        Get the capabilities of this provider.
        
        Returns:
            ProviderCapabilities: Capabilities of the provider
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the provider.
        
        Returns:
            Dict with health status and details
        """
        pass
    
    async def shutdown(self):
        """
        Clean shutdown of the provider.
        """
        pass


class MultiProviderFirewall(ABC):
    """
    Interface for managing multiple firewall providers.
    Allows failover and load balancing between providers.
    """
    
    @abstractmethod
    async def add_provider(
        self,
        provider: FirewallProviderBase,
        priority: int = 100
    ) -> bool:
        """Add a new provider with priority."""
        pass
    
    @abstractmethod
    async def remove_provider(self, provider_name: str) -> bool:
        """Remove a provider."""
        pass
    
    @abstractmethod
    async def get_active_provider(self) -> FirewallProviderBase:
        """Get the currently active provider."""
        pass
    
    @abstractmethod
    async def failover_to_provider(self, provider_name: str) -> bool:
        """Failover to another provider."""
        pass
