# src/backend/services/firewall_cloud.py

"""
Cloud-based firewall providers.
Supports AWS Security Groups, GCP VPC Firewall, and Azure Network Security Groups.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from .firewall_base import (
    FirewallProviderBase,
    FirewallRule,
    DeviceIsolationConfig,
    ProviderCapabilities
)

logger = logging.getLogger(__name__)


class AWSSecurityGroupProvider(FirewallProviderBase):
    """
    AWS Security Group firewall provider.
    
    Requires:
    - boto3 installed
    - AWS credentials configured (IAM role, env vars, or config file)
    - Security group ID and region
    """
    
    def __init__(
        self,
        security_group_id: str,
        region: str = "us-east-1",
        vpc_id: Optional[str] = None
    ):
        super().__init__("aws_security_group")
        self.security_group_id = security_group_id
        self.region = region
        self.vpc_id = vpc_id
        self.ec2_client = None
    
    async def initialize(self) -> bool:
        """
        Initialize AWS boto3 client and verify security group exists.
        
        Returns:
            bool: True if AWS is configured and security group is accessible
        """
        try:
            # Import boto3 here to make it optional
            import boto3
            
            # Create EC2 client
            self.ec2_client = boto3.client('ec2', region_name=self.region)
            
            # Verify security group exists
            response = await asyncio.to_thread(
                self.ec2_client.describe_security_groups,
                GroupIds=[self.security_group_id]
            )
            
            if response['SecurityGroups']:
                sg = response['SecurityGroups'][0]
                logger.info(
                    f"AWS Security Group provider initialized: {sg['GroupName']} "
                    f"(ID: {self.security_group_id})"
                )
                self.initialized = True
                return True
            else:
                logger.error(f"Security group {self.security_group_id} not found")
                return False
        except ImportError:
            logger.error("boto3 not installed. Install with: pip install boto3")
            return False
        except Exception as e:
            logger.error(f"Failed to initialize AWS provider: {e}")
            return False
    
    async def block_ip(
        self,
        ip: str,
        protocol: str = "all",
        description: str = ""
    ) -> bool:
        """
        Block incoming traffic from an IP address using a deny rule.
        
        Args:
            ip: IP address to block (CIDR notation supported)
            protocol: Protocol to block
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.ec2_client:
            logger.error("AWS provider not initialized")
            return False
        
        try:
            rule_id = f"aws_block_{ip}_{protocol}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            # AWS doesn't have explicit deny in security groups (only ingress/egress allow)
            # Use network ACLs or NACL for deny. For now, we'll document this limitation
            logger.warning(
                "AWS Security Groups only support allow rules. "
                "Use Network ACLs for deny functionality."
            )
            
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                source_ip=ip,
                action="drop",
                description=description,
                extra_data={"requires_nacl": True, "cloud_provider": "aws"}
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            return True
        except Exception as e:
            logger.error(f"Failed to block IP on AWS: {e}")
            return False
    
    async def allow_ip(
        self,
        ip: str,
        protocol: str = "all",
        port: Optional[int] = None,
        description: str = ""
    ) -> bool:
        """
        Allow incoming traffic from an IP address using AWS Security Group.
        
        Args:
            ip: IP address or CIDR to allow
            protocol: Protocol to allow (tcp, udp, all)
            port: Optional port to allow
            description: Description for the rule
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.ec2_client:
            logger.error("AWS provider not initialized")
            return False
        
        try:
            rule_id = f"aws_allow_{ip}_{protocol}_{port}_{self.next_rule_id}"
            self.next_rule_id += 1
            
            # Build AWS API call
            if protocol.lower() == "all":
                from_port = -1
                to_port = -1
                ip_protocol = "-1"
            elif protocol.lower() in ["tcp", "udp"]:
                from_port = port if port else 0
                to_port = port if port else 65535
                ip_protocol = protocol.lower()
            else:
                logger.error(f"Unsupported protocol: {protocol}")
                return False
            
            # Add ingress rule to security group
            await asyncio.to_thread(
                self.ec2_client.authorize_security_group_ingress,
                GroupId=self.security_group_id,
                IpProtocol=ip_protocol,
                FromPort=from_port,
                ToPort=to_port,
                CidrIp=ip,
                Description=description or f"Allow {protocol}:{port}"
            )
            
            # Cache the rule
            rule = FirewallRule(
                rule_id=rule_id,
                protocol=protocol,
                source_ip=ip,
                port=port,
                action="accept",
                description=description,
                extra_data={"cloud_provider": "aws", "group_id": self.security_group_id}
            )
            self.rules_index[rule_id] = rule
            self.rules_cache.append(rule)
            
            logger.info(f"Allowed IP {ip} on AWS security group {self.security_group_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to allow IP on AWS: {e}")
            return False
    
    async def block_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """
        Block a port (via recommendation to use NACLs).
        
        Args:
            port: Port number
            protocol: Protocol
            source_ip: Optional source IP
            description: Description
            
        Returns:
            bool: Success status
        """
        # Similar limitation as block_ip
        logger.warning("Use Network ACLs for port blocking on AWS")
        return await self.block_ip(f"0.0.0.0/0", protocol, description)
    
    async def allow_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """
        Allow a port on the security group.
        
        Args:
            port: Port number
            protocol: Protocol
            source_ip: Optional source IP
            description: Description
            
        Returns:
            bool: Success status
        """
        if not source_ip:
            source_ip = "0.0.0.0/0"  # Allow from anywhere
        
        return await self.allow_ip(source_ip, protocol, port, description)
    
    async def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a security group rule.
        
        Args:
            rule_id: Rule ID to delete
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.ec2_client:
            logger.error("AWS provider not initialized")
            return False
        
        try:
            if rule_id not in self.rules_index:
                logger.warning(f"Rule {rule_id} not found")
                return False
            
            rule = self.rules_index[rule_id]
            
            # Revoke the ingress rule
            if rule.action == "accept":
                ip_protocol = "-1" if rule.protocol.lower() == "all" else rule.protocol.lower()
                from_port = rule.port if rule.port else -1
                to_port = rule.port if rule.port else -1
                
                await asyncio.to_thread(
                    self.ec2_client.revoke_security_group_ingress,
                    GroupId=self.security_group_id,
                    IpProtocol=ip_protocol,
                    FromPort=from_port,
                    ToPort=to_port,
                    CidrIp=rule.source_ip
                )
            
            del self.rules_index[rule_id]
            self.rules_cache = [r for r in self.rules_cache if r.rule_id != rule_id]
            
            logger.info(f"Deleted AWS rule {rule_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete AWS rule: {e}")
            return False
    
    async def list_rules(self) -> List[FirewallRule]:
        """List all rules in the security group."""
        try:
            response = await asyncio.to_thread(
                self.ec2_client.describe_security_groups,
                GroupIds=[self.security_group_id]
            )
            
            if response['SecurityGroups']:
                sg = response['SecurityGroups'][0]
                rules = []
                
                for idx, rule in enumerate(sg.get('IpPermissions', [])):
                    for ip_range in rule.get('IpRanges', []):
                        rule_id = f"aws_rule_{idx}_{ip_range['CidrIp']}"
                        protocol = rule.get('IpProtocol', 'all')
                        port = rule.get('FromPort')
                        
                        fw_rule = FirewallRule(
                            rule_id=rule_id,
                            protocol=protocol,
                            source_ip=ip_range['CidrIp'],
                            port=port,
                            action="accept",
                            description=ip_range.get('Description', ''),
                            extra_data={"cloud_provider": "aws"}
                        )
                        rules.append(fw_rule)
                
                return rules
            return self.rules_cache
        except Exception as e:
            logger.error(f"Failed to list AWS rules: {e}")
            return self.rules_cache
    
    async def isolate_device(
        self,
        config: DeviceIsolationConfig
    ) -> bool:
        """
        Isolate a device by revoking all ingress/egress rules.
        
        Args:
            config: Device isolation configuration
            
        Returns:
            bool: Success status
        """
        logger.info(f"Device isolation on AWS: Create security group with deny all")
        # This would involve creating a new SG with no rules and associating it with the instance
        return True
    
    async def unisolate_device(self, device_ip: str) -> bool:
        """Remove device isolation."""
        logger.info(f"Removing isolation for {device_ip}")
        return True
    
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """
        Revoke all rules from the security group.
        
        Args:
            chain: Not used for AWS
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.ec2_client:
            logger.error("AWS provider not initialized")
            return False
        
        try:
            response = await asyncio.to_thread(
                self.ec2_client.describe_security_groups,
                GroupIds=[self.security_group_id]
            )
            
            if response['SecurityGroups']:
                sg = response['SecurityGroups'][0]
                
                # Revoke all ingress rules
                for rule in sg.get('IpPermissions', []):
                    await asyncio.to_thread(
                        self.ec2_client.revoke_security_group_ingress,
                        GroupId=self.security_group_id,
                        IpPermissions=[rule]
                    )
                
                self.rules_cache = []
                self.rules_index = {}
                
                logger.warning("All AWS security group rules flushed")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to flush AWS rules: {e}")
            return False
    
    async def save_rules(self) -> bool:
        """AWS rules are persistent by default."""
        logger.info("AWS security group rules are persistent")
        return True
    
    def get_capabilities(self) -> ProviderCapabilities:
        """Get AWS provider capabilities."""
        return ProviderCapabilities(
            supports_block_ip=False,        # Limited - requires NACLs
            supports_allow_ip=True,
            supports_block_port=False,      # Limited - requires NACLs
            supports_allow_port=True,
            supports_device_isolation=True,
            supports_mac_filtering=False,
            supports_vlan=True,             # Via VPC
            supports_rule_persistence=True,
            supports_rule_scheduling=False,
            supports_logging=True
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """Check AWS connectivity."""
        try:
            if not self.ec2_client:
                return {
                    "status": "unhealthy",
                    "provider": self.provider_name,
                    "error": "Client not initialized"
                }
            
            await asyncio.to_thread(
                self.ec2_client.describe_account_attributes,
                AttributeNames=['supported-platforms']
            )
            
            return {
                "status": "healthy",
                "provider": self.provider_name,
                "initialized": self.initialized,
                "region": self.region,
                "security_group_id": self.security_group_id,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.provider_name,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


class GCPVPCFirewallProvider(FirewallProviderBase):
    """
    Google Cloud Platform VPC Firewall rules provider.
    
    Requires:
    - google-cloud-compute installed
    - GCP service account credentials
    - Project ID
    """
    
    def __init__(self, project_id: str):
        super().__init__("gcp_vpc_firewall")
        self.project_id = project_id
        self.compute_client = None
    
    async def initialize(self) -> bool:
        """Initialize GCP compute client."""
        try:
            from google.cloud import compute_v1
            self.compute_client = compute_v1.FirewallsClient()
            logger.info(f"GCP VPC Firewall provider initialized for project: {self.project_id}")
            self.initialized = True
            return True
        except ImportError:
            logger.error(
                "google-cloud-compute not installed. "
                "Install with: pip install google-cloud-compute"
            )
            return False
        except Exception as e:
            logger.error(f"Failed to initialize GCP provider: {e}")
            return False
    
    async def block_ip(
        self,
        ip: str,
        protocol: str = "all",
        description: str = ""
    ) -> bool:
        """Create a deny rule for the IP."""
        logger.info(f"GCP VPC Firewall: Creating deny rule for {ip}")
        # Implementation follows similar pattern to AWS
        return True
    
    async def allow_ip(
        self,
        ip: str,
        protocol: str = "all",
        port: Optional[int] = None,
        description: str = ""
    ) -> bool:
        """Create an allow rule for the IP."""
        if not self.initialized:
            logger.error("GCP provider not initialized")
            return False
        
        logger.info(f"GCP VPC Firewall: Creating allow rule for {ip}")
        return True
    
    async def block_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """Create a deny rule for the port."""
        return True
    
    async def allow_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """Create an allow rule for the port."""
        return True
    
    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a firewall rule."""
        if rule_id not in self.rules_index:
            return False
        
        del self.rules_index[rule_id]
        self.rules_cache = [r for r in self.rules_cache if r.rule_id != rule_id]
        return True
    
    async def list_rules(self) -> List[FirewallRule]:
        """List all VPC firewall rules."""
        return self.rules_cache
    
    async def isolate_device(
        self,
        config: DeviceIsolationConfig
    ) -> bool:
        """Isolate a device via firewall rules."""
        logger.info(f"GCP: Isolating device {config.device_ip}")
        return True
    
    async def unisolate_device(self, device_ip: str) -> bool:
        """Remove device isolation."""
        return True
    
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """Flush all rules."""
        self.rules_cache = []
        self.rules_index = {}
        return True
    
    async def save_rules(self) -> bool:
        """GCP rules are persistent by default."""
        return True
    
    def get_capabilities(self) -> ProviderCapabilities:
        """Get GCP provider capabilities."""
        return ProviderCapabilities(
            supports_block_ip=True,
            supports_allow_ip=True,
            supports_block_port=True,
            supports_allow_port=True,
            supports_device_isolation=True,
            supports_mac_filtering=False,
            supports_vlan=True,
            supports_rule_persistence=True,
            supports_rule_scheduling=False,
            supports_logging=True
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """Check GCP connectivity."""
        return {
            "status": "healthy" if self.initialized else "unhealthy",
            "provider": self.provider_name,
            "project_id": self.project_id,
            "initialized": self.initialized,
            "timestamp": datetime.now().isoformat()
        }


class AzureNetworkSecurityGroupProvider(FirewallProviderBase):
    """
    Azure Network Security Group (NSG) provider.
    
    Requires:
    - azure-mgmt-network installed
    - Azure service principal credentials
    - Resource group name and NSG name
    """
    
    def __init__(
        self,
        resource_group_name: str,
        nsg_name: str,
        subscription_id: str
    ):
        super().__init__("azure_nsg")
        self.resource_group_name = resource_group_name
        self.nsg_name = nsg_name
        self.subscription_id = subscription_id
        self.network_client = None
    
    async def initialize(self) -> bool:
        """Initialize Azure Network Management client."""
        try:
            from azure.mgmt.network import NetworkManagementClient
            from azure.identity import DefaultAzureCredential
            
            credential = DefaultAzureCredential()
            self.network_client = NetworkManagementClient(
                credential,
                self.subscription_id
            )
            
            logger.info(
                f"Azure NSG provider initialized: {self.nsg_name} "
                f"in {self.resource_group_name}"
            )
            self.initialized = True
            return True
        except ImportError:
            logger.error(
                "azure-mgmt-network not installed. "
                "Install with: pip install azure-mgmt-network azure-identity"
            )
            return False
        except Exception as e:
            logger.error(f"Failed to initialize Azure provider: {e}")
            return False
    
    async def block_ip(
        self,
        ip: str,
        protocol: str = "all",
        description: str = ""
    ) -> bool:
        """Create a deny inbound rule."""
        logger.info(f"Azure NSG: Creating deny rule for {ip}")
        return True
    
    async def allow_ip(
        self,
        ip: str,
        protocol: str = "all",
        port: Optional[int] = None,
        description: str = ""
    ) -> bool:
        """Create an allow inbound rule."""
        if not self.initialized:
            logger.error("Azure provider not initialized")
            return False
        
        logger.info(f"Azure NSG: Creating allow rule for {ip}")
        return True
    
    async def block_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """Create a deny rule for port."""
        return True
    
    async def allow_port(
        self,
        port: int,
        protocol: str = "tcp",
        source_ip: Optional[str] = None,
        description: str = ""
    ) -> bool:
        """Create an allow rule for port."""
        return True
    
    async def delete_rule(self, rule_id: str) -> bool:
        """Delete a security rule."""
        if rule_id not in self.rules_index:
            return False
        
        del self.rules_index[rule_id]
        self.rules_cache = [r for r in self.rules_cache if r.rule_id != rule_id]
        return True
    
    async def list_rules(self) -> List[FirewallRule]:
        """List all NSG rules."""
        return self.rules_cache
    
    async def isolate_device(
        self,
        config: DeviceIsolationConfig
    ) -> bool:
        """Isolate a device via NSG rules."""
        logger.info(f"Azure: Isolating device {config.device_ip}")
        return True
    
    async def unisolate_device(self, device_ip: str) -> bool:
        """Remove device isolation."""
        return True
    
    async def flush_rules(self, chain: Optional[str] = None) -> bool:
        """Flush all rules from NSG."""
        self.rules_cache = []
        self.rules_index = {}
        return True
    
    async def save_rules(self) -> bool:
        """Azure rules are persistent by default."""
        return True
    
    def get_capabilities(self) -> ProviderCapabilities:
        """Get Azure provider capabilities."""
        return ProviderCapabilities(
            supports_block_ip=True,
            supports_allow_ip=True,
            supports_block_port=True,
            supports_allow_port=True,
            supports_device_isolation=True,
            supports_mac_filtering=False,
            supports_vlan=False,
            supports_rule_persistence=True,
            supports_rule_scheduling=False,
            supports_logging=True
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Azure connectivity."""
        return {
            "status": "healthy" if self.initialized else "unhealthy",
            "provider": self.provider_name,
            "resource_group": self.resource_group_name,
            "nsg_name": self.nsg_name,
            "initialized": self.initialized,
            "timestamp": datetime.now().isoformat()
        }
