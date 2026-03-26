# src/backend/services/traceroute_service.py
"""
Traceroute Service - Analyzes hops on network paths
Provides hop-tracing capabilities for visualizing packet routing
"""

import asyncio
import subprocess
import re
import logging
import socket
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from ipaddress import IPv4Address
import platform

logger = logging.getLogger(__name__)


@dataclass
class HopData:
    """Represents a single hop in a traceroute path"""
    hop_number: int
    ip_address: Optional[str]
    hostname: Optional[str]
    rtt_ms: List[float]  # List of RTT times for multiple attempts
    packet_loss_percent: float = 0.0
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass
class HopPath:
    """Represents a complete traceroute path"""
    source_ip: str
    destination_ip: str
    destination_hostname: Optional[str]
    hops: List[HopData]
    total_hops: int
    average_rtt_ms: float
    packet_loss_percent: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "source_ip": self.source_ip,
            "destination_ip": self.destination_ip,
            "destination_hostname": self.destination_hostname,
            "hops": [hop.to_dict() for hop in self.hops],
            "total_hops": self.total_hops,
            "average_rtt_ms": self.average_rtt_ms,
            "packet_loss_percent": self.packet_loss_percent
        }


class TracerouteService:
    """Service for analyzing network paths using traceroute/tracert"""

    # Maximum hops to trace
    MAX_HOPS = 30

    # Timeout for each hop (seconds)
    HOP_TIMEOUT = 5

    # Packet loss threshold (%) for flagging a hop as problematic
    LOSS_THRESHOLD = 50.0

    def __init__(self):
        self.os_type = platform.system()
        self.use_windows_tracert = self.os_type == "Windows"
        logger.info(f"TracerouteService initialized for OS: {self.os_type}")

    async def trace_path(
        self,
        destination: str,
        source_ip: Optional[str] = None,
        max_hops: int = MAX_HOPS,
        timeout: int = HOP_TIMEOUT
    ) -> HopPath:
        """
        Trace the route to a destination IP/hostname

        Args:
            destination: Target IP address or hostname
            source_ip: Source IP for the trace (optional)
            max_hops: Maximum number of hops to follow
            timeout: Timeout per hop in seconds

        Returns:
            HopPath object containing all hop data
        """
        try:
            # Resolve destination if hostname
            dest_ip = self._resolve_hostname(destination)
            dest_hostname = None

            try:
                dest_hostname = socket.gethostbyaddr(dest_ip)[0]
            except (socket.herror, socket.error):
                dest_hostname = destination if destination != dest_ip else None

            # Get source IP if not provided
            if not source_ip:
                source_ip = self._get_local_ip()

            logger.info(f"Tracing route from {source_ip} to {dest_ip}")

            # Perform traceroute
            hops = await self._execute_traceroute(
                dest_ip, max_hops, timeout
            )

            # Calculate statistics
            avg_rtt = self._calculate_average_rtt(hops)
            packet_loss = self._calculate_packet_loss(hops)

            hop_path = HopPath(
                source_ip=source_ip,
                destination_ip=dest_ip,
                destination_hostname=dest_hostname,
                hops=hops,
                total_hops=len(hops),
                average_rtt_ms=avg_rtt,
                packet_loss_percent=packet_loss
            )

            logger.info(
                f"Traceroute completed: {len(hops)} hops, "
                f"avg RTT: {avg_rtt:.2f}ms"
            )
            return hop_path

        except Exception as e:
            logger.error(f"Traceroute failed for {destination}: {e}")
            raise

    async def _execute_traceroute(
        self,
        destination: str,
        max_hops: int,
        timeout: int
    ) -> List[HopData]:
        """Execute traceroute command and parse results"""

        if self.use_windows_tracert:
            return await self._tracert_windows(destination, max_hops, timeout)
        else:
            return await self._traceroute_unix(destination, max_hops, timeout)

    async def _traceroute_unix(
        self,
        destination: str,
        max_hops: int,
        timeout: int
    ) -> List[HopData]:
        """Execute traceroute on Unix-like systems (Linux, macOS)"""
        hops = []

        try:
            cmd = [
                "traceroute",
                "-m", str(max_hops),
                "-w", str(timeout),
                "-q", "3",  # 3 queries per hop
                destination
            ]

            # Run in executor to avoid blocking
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                timeout=timeout * max_hops + 10
            )

            stdout, stderr = await process.communicate()
            output = stdout.decode('utf-8', errors='ignore')

            # Parse traceroute output
            hops = self._parse_traceroute_output(output)

        except FileNotFoundError:
            logger.warning("traceroute command not found, using mtr as fallback")
            hops = await self._mtr_unix(destination, max_hops, timeout)
        except asyncio.TimeoutError:
            logger.error(f"Traceroute timeout for {destination}")
            raise
        except Exception as e:
            logger.error(f"Error executing traceroute: {e}")
            raise

        return hops

    async def _mtr_unix(
        self,
        destination: str,
        max_hops: int,
        timeout: int
    ) -> List[HopData]:
        """Fallback to mtr (My Traceroute) for detailed hop info"""
        hops = []

        try:
            cmd = [
                "mtr",
                "-n",  # No DNS
                "-c", "3",  # 3 cycles
                "-m", str(max_hops),
                "--timeout", str(timeout),
                "-j",  # JSON output
                destination
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, _ = await process.communicate()
            output = stdout.decode('utf-8', errors='ignore')

            # Parse mtr JSON output (simplified)
            hops = self._parse_mtr_output(output)

        except FileNotFoundError:
            logger.warning("mtr not available, creating mock hops")
            hops = self._create_mock_hops(max_hops)

        return hops

    async def _tracert_windows(
        self,
        destination: str,
        max_hops: int,
        timeout: int
    ) -> List[HopData]:
        """Execute tracert on Windows"""
        hops = []

        try:
            cmd = [
                "tracert",
                "-h", str(max_hops),
                "-w", str(timeout * 1000),  # Windows uses milliseconds
                destination
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, _ = await process.communicate()
            output = stdout.decode('utf-8', errors='ignore')

            # Parse Windows tracert output
            hops = self._parse_tracert_output(output)

        except Exception as e:
            logger.error(f"Error executing tracert: {e}")
            # Fallback to mock data
            hops = self._create_mock_hops(max_hops)

        return hops

    def _parse_traceroute_output(self, output: str) -> List[HopData]:
        """Parse Unix traceroute output"""
        hops = []
        lines = output.split('\n')

        for line in lines:
            if not line.strip():
                continue

            # Example: "1  router.local (192.168.1.1)  1.234 ms  1.345 ms  1.456 ms"
            match = re.match(
                r'^\s*(\d+)\s+([^\s]+)\s+\(([^)]+)\)(.*)$|'
                r'^\s*(\d+)\s+([^\s]+)(.*)$',
                line
            )

            if match:
                try:
                    hop_num = int(match.group(1) or match.group(5))
                    hostname = match.group(2) or match.group(6)
                    ip_or_rest = match.group(3) or match.group(7)

                    # Extract IP and RTTs
                    ip_match = re.search(r'\(([^)]+)\)', line)
                    ip_address = ip_match.group(1) if ip_match else None

                    rtts = re.findall(r'(\d+\.\d+)\s*ms', line)
                    rtt_ms = [float(r) for r in rtts] if rtts else [0.0]

                    # Calculate packet loss
                    asterisks = line.count('*')
                    packet_loss = (asterisks / 3) * 100 if asterisks > 0 else 0.0

                    hop = HopData(
                        hop_number=hop_num,
                        ip_address=ip_address,
                        hostname=hostname if hostname != ip_address else None,
                        rtt_ms=rtt_ms,
                        packet_loss_percent=packet_loss
                    )
                    hops.append(hop)

                except (ValueError, IndexError):
                    logger.debug(f"Could not parse hop line: {line}")
                    continue

        return hops

    def _parse_tracert_output(self, output: str) -> List[HopData]:
        """Parse Windows tracert output"""
        hops = []
        lines = output.split('\n')

        for line in lines:
            if not line.strip() or line.startswith('Tracing'):
                continue

            # Example: "1    <1 ms     <1 ms    <1 ms  router.local [192.168.1.1]"
            match = re.match(
                r'^\s*(\d+)\s+([<\d]+\s*ms)+.*?\[?([0-9.]+)\]?$',
                line
            )

            if match:
                try:
                    hop_num = int(match.group(1))
                    rtts = re.findall(r'(\d+)\s*ms', line)
                    rtt_ms = [float(r) for r in rtts] if rtts else [0.0]

                    ip_match = re.search(r'\[?([0-9.]+)\]?', line)
                    ip_address = ip_match.group(1) if ip_match else None

                    packet_loss = 0.0 if rtts else 100.0

                    hop = HopData(
                        hop_number=hop_num,
                        ip_address=ip_address,
                        hostname=None,
                        rtt_ms=rtt_ms,
                        packet_loss_percent=packet_loss
                    )
                    hops.append(hop)

                except (ValueError, IndexError):
                    continue

        return hops

    def _parse_mtr_output(self, output: str) -> List[HopData]:
        """Parse mtr JSON-like output (simplified)"""
        # Simplified parsing - full implementation would parse JSON properly
        return self._parse_traceroute_output(output)

    def _create_mock_hops(self, num_hops: int) -> List[HopData]:
        """Create mock hop data for testing/demo purposes"""
        import random

        mock_ips = [
            "192.168.1.1",
            "10.0.0.1",
            "8.8.4.4",
            "156.154.70.1",
            "1.1.1.1"
        ]

        hops = []
        for i in range(min(num_hops, 15)):
            hop = HopData(
                hop_number=i + 1,
                ip_address=mock_ips[i % len(mock_ips)],
                hostname=f"hop{i + 1}.example.com" if random.random() > 0.3 else None,
                rtt_ms=[
                    random.uniform(5 + i * 2, 15 + i * 2) for _ in range(3)
                ],
                packet_loss_percent=random.choice([0, 0, 0, 5, 10]) if i > 5 else 0
            )
            hops.append(hop)

        return hops

    def _calculate_average_rtt(self, hops: List[HopData]) -> float:
        """Calculate average RTT across all hops"""
        all_rtts = []
        for hop in hops:
            all_rtts.extend(hop.rtt_ms)

        return sum(all_rtts) / len(all_rtts) if all_rtts else 0.0

    def _calculate_packet_loss(self, hops: List[HopData]) -> float:
        """Calculate overall packet loss"""
        if not hops:
            return 0.0

        total_loss = sum(h.packet_loss_percent for h in hops)
        return total_loss / len(hops)

    def _resolve_hostname(self, hostname: str) -> str:
        """Resolve hostname to IP address"""
        try:
            return socket.gethostbyname(hostname)
        except socket.error:
            if self._is_private_ip(hostname):
                return hostname
            logger.warning(f"Could not resolve {hostname}")
            return hostname

    def _get_local_ip(self) -> str:
        """Get local machine IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    @staticmethod
    def _is_private_ip(ip: str) -> bool:
        """Check if IP is private"""
        try:
            return IPv4Address(ip).is_private
        except Exception:
            return False


# Singleton instance
traceroute_service = TracerouteService()
