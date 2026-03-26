# src/backend/api_gateway/endpoints/visualization_websockets.py

"""
WebSocket endpoints for 3D visualization real-time data streams.
Handles LAN device updates, WAN traffic, and threat events.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any, Set, Optional
import json
import asyncio
import logging
from datetime import datetime
import random
import aiohttp

logger = logging.getLogger(__name__)

router = APIRouter()


class VisualizationConnectionManager:
    """Manages WebSocket connections for visualization data streams."""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.lan_subscribers: Set[WebSocket] = set()
        self.wan_subscribers: Set[WebSocket] = set()
        self.threat_subscribers: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Visualization WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        self.lan_subscribers.discard(websocket)
        self.wan_subscribers.discard(websocket)
        self.threat_subscribers.discard(websocket)
        logger.info(f"Visualization WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific WebSocket."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending visualization message: {e}")
            self.disconnect(websocket)
    
    async def broadcast_device_update(self, device_data: Dict[str, Any]):
        """Broadcast device update to LAN subscribers."""
        message = {"type": "device_update", "data": device_data, "timestamp": datetime.now().timestamp()}
        disconnected = []
        
        for connection in self.lan_subscribers:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting device update: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_wan_traffic(self, traffic_data: Dict[str, Any]):
        """Broadcast WAN traffic to subscribers."""
        message = {"type": "wan_traffic", "data": traffic_data, "timestamp": datetime.now().timestamp()}
        disconnected = []
        
        for connection in self.wan_subscribers:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting WAN traffic: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_threat_event(self, threat_data: Dict[str, Any]):
        """Broadcast threat event to subscribers."""
        message = {"type": "threat_event", "data": threat_data, "timestamp": datetime.now().timestamp()}
        disconnected = []
        
        for connection in self.threat_subscribers:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting threat event: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)


# Global manager
viz_manager = VisualizationConnectionManager()


async def generate_mock_device() -> Dict[str, Any]:
    """Generate mock device data for demonstration."""
    device_types = ['router', 'pc', 'server', 'mobile', 'iot']
    statuses = ['online', 'offline', 'suspicious']
    threat_levels = ['low', 'medium', 'high', 'critical']
    
    return {
        "id": f"device-{random.randint(1, 20)}",
        "name": f"{random.choice(device_types)}-{random.randint(1, 20)}",
        "ip": f"192.168.1.{random.randint(10, 254)}",
        "mac": f"00:11:22:33:44:{random.randint(0, 255):02x}",
        "status": random.choice(statuses),
        "type": random.choice(device_types),
        "traffic_in": random.randint(100, 1000),
        "traffic_out": random.randint(100, 1000),
        "threat_level": random.choice(threat_levels),
    }


async def generate_mock_wan_traffic() -> Dict[str, Any]:
    """Generate mock WAN traffic data."""
    countries = [
        {"name": "US", "lat": 37.0902, "lon": -95.7129},
        {"name": "CN", "lat": 35.8617, "lon": 104.1954},
        {"name": "RU", "lat": 61.5240, "lon": 105.3188},
        {"name": "GB", "lat": 55.3781, "lon": -3.4360},
        {"name": "DE", "lat": 51.1657, "lon": 10.4515},
    ]
    
    source = random.choice(countries)
    dest = random.choice(countries)
    
    return {
        "id": f"traffic-{random.randint(1, 1000)}",
        "source_ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}",
        "source_country": source["name"],
        "source_lat": source["lat"],
        "source_lon": source["lon"],
        "dest_ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}",
        "dest_country": dest["name"],
        "dest_lat": dest["lat"],
        "dest_lon": dest["lon"],
        "bytes": random.randint(100, 10000),
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
        "threat_score": random.random(),
    }


async def generate_mock_threat_event() -> Dict[str, Any]:
    """Generate mock threat event data."""
    threat_types = ["DDoS", "Malware", "Phishing", "Zero-Day", "RCE", "SQLi"]
    severities = ["low", "medium", "high", "critical"]
    countries = [
        {"name": "CN", "lat": 35.8617, "lon": 104.1954},
        {"name": "RU", "lat": 61.5240, "lon": 105.3188},
        {"name": "IRAN", "lat": 32.4279, "lon": 53.6880},
    ]
    
    source = random.choice(countries)
    dest = random.choice([c for c in countries if c != source])
    
    return {
        "id": f"threat-{random.randint(1, 10000)}",
        "type": random.choice(threat_types),
        "severity": random.choice(severities),
        "source_ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}",
        "source_country": source["name"],
        "source_lat": source["lat"],
        "source_lon": source["lon"],
        "target_ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}",
        "target_country": dest["name"],
        "target_lat": dest["lat"],
        "target_lon": dest["lon"],
        "description": f"{random.choice(threat_types)} attack from {source['name']} detected",
    }


async def broadcast_device_updates():
    """Continuously broadcast device updates with real data preference."""
    while True:
        try:
            # Try to fetch real data first
            real_data = await fetch_real_network_data()
            if real_data and real_data['type'] == 'device_update':
                await viz_manager.broadcast_device_update(real_data['data'])
            else:
                # Fall back to mock data
                device = await generate_mock_device()
                await viz_manager.broadcast_device_update(device)
            await asyncio.sleep(random.uniform(2, 5))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in device update broadcaster: {e}")
            await asyncio.sleep(1)


async def broadcast_wan_traffic():
    """Continuously broadcast WAN traffic with real data preference."""
    while True:
        try:
            if random.random() > 0.3:  # 70% chance to generate traffic
                # Try to fetch real data first
                real_data = await fetch_real_network_data()
                if real_data and real_data['type'] == 'connection_update':
                    await viz_manager.broadcast_wan_traffic(real_data['data'])
                else:
                    # Fall back to mock data
                    traffic = await generate_mock_wan_traffic()
                    await viz_manager.broadcast_wan_traffic(traffic)
            await asyncio.sleep(random.uniform(1, 3))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in WAN traffic broadcaster: {e}")
            await asyncio.sleep(1)


async def broadcast_threat_events():
    """Continuously broadcast threat events with real data preference."""
    while True:
        try:
            if random.random() > 0.7:  # 30% chance to generate threat
                # Try to fetch real data first
                real_data = await fetch_real_network_data()
                if real_data and real_data['type'] == 'threat_event':
                    await viz_manager.broadcast_threat_event(real_data['data'])
                else:
                    # Fall back to mock data
                    threat = await generate_mock_threat_event()
                    await viz_manager.broadcast_threat_event(threat)
            await asyncio.sleep(random.uniform(3, 8))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in threat event broadcaster: {e}")
            await asyncio.sleep(1)


async def fetch_real_network_data() -> Optional[Dict[str, Any]]:
    """
    Fetch real network capture data from backend services.
    Integrates with network capture, threat intel, and enrichment services.
    Falls back to mock data if real services are unavailable.
    """
    try:
        async with aiohttp.ClientSession() as session:
            # Fetch device discovery data
            try:
                async with session.get('http://localhost:8000/api/v1/device-discovery/devices', timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get('devices'):
                            device = random.choice(data['devices'][:100])  # Pick random device
                            return {
                                'type': 'device_update',
                                'data': {
                                    'id': device.get('id', f'device-{random.randint(1, 1000)}'),
                                    'name': device.get('hostname', 'Unknown Device'),
                                    'ip': device.get('ip_address', '192.168.1.1'),
                                    'mac': device.get('mac_address', '00:00:00:00:00:00'),
                                    'status': 'online' if device.get('is_active') else 'offline',
                                    'type': device.get('device_type', 'unknown'),
                                    'traffic_in': random.randint(100, 1000),
                                    'traffic_out': random.randint(100, 1000),
                                    'threat_level': random.choice(['low', 'medium', 'high', 'critical']),
                                }
                            }
            except asyncio.TimeoutError:
                logger.debug("Device discovery timeout")
            except Exception as e:
                logger.debug(f"Could not fetch device discovery: {e}")
            
            # Fetch network logs / traffic data
            try:
                async with session.get('http://localhost:8000/api/v1/logs/network?limit=100', timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        logs = await resp.json()
                        if logs.get('logs'):
                            log = random.choice(logs['logs'])
                            return {
                                'type': 'connection_update',
                                'data': {
                                    'id': f'traffic-{random.randint(1, 10000)}',
                                    'source_ip': log.get('source_ip', '192.168.1.1'),
                                    'source_country': log.get('geoip', {}).get('country', 'US'),
                                    'dest_ip': log.get('dest_ip', '8.8.8.8'),
                                    'dest_country': log.get('dest_geoip', {}).get('country', 'US'),
                                    'bytes': int(log.get('size', random.randint(100, 10000))),
                                    'protocol': log.get('protocol', 'TCP'),
                                    'threat_score': random.random(),
                                }
                            }
            except asyncio.TimeoutError:
                logger.debug("Network logs timeout")
            except Exception as e:
                logger.debug(f"Could not fetch network logs: {e}")
            
            # Fetch threat data
            try:
                async with session.get('http://localhost:8000/api/v1/threats/active?limit=50', timeout=aiohttp.ClientTimeout(total=2)) as resp:
                    if resp.status == 200:
                        threats = await resp.json()
                        if threats.get('threats'):
                            threat = random.choice(threats['threats'])
                            return {
                                'type': 'threat_event',
                                'data': {
                                    'id': threat.get('id', f'threat-{random.randint(1, 10000)}'),
                                    'type': threat.get('threat_type', 'Unknown'),
                                    'severity': threat.get('severity', 'medium'),
                                    'source_ip': threat.get('source_ip', '0.0.0.0'),
                                    'source_country': threat.get('source_country', 'Unknown'),
                                    'target_ip': threat.get('target_ip', '0.0.0.0'),
                                    'target_country': threat.get('target_country', 'Unknown'),
                                    'description': threat.get('description', 'Security threat detected'),
                                    'timestamp': datetime.now().timestamp(),
                                }
                            }
            except asyncio.TimeoutError:
                logger.debug("Threat data timeout")
            except Exception as e:
                logger.debug(f"Could not fetch threat data: {e}")
    
    except Exception as e:
        logger.debug(f"Error in fetch_real_network_data: {e}")
    
    # Fallback to mock data
    return None


async def integrate_real_and_mock_data():
    """
    Broadcaster that tries to use real data with fallback to mock.
    """
    real_data_cache = {'devices': [], 'traffic': [], 'threats': []}
    
    while True:
        try:
            # Periodically refresh real data (every 30 seconds)
            if random.random() > 0.95:  # 5% chance per iteration
                real_data = await fetch_real_network_data()
                if real_data:
                    if real_data['type'] == 'device_data':
                        real_data_cache['devices'] = real_data['data']
                    elif real_data['type'] == 'traffic_data':
                        real_data_cache['traffic'] = real_data['data']
                    elif real_data['type'] == 'threat_data':
                        real_data_cache['threats'] = real_data['data']
            
            # Decide: use real data or mock
            use_real = random.random() > 0.3  # 70% try to use real
            
            # Emit device if available
            if real_data_cache['devices'] and use_real:
                device = random.choice(real_data_cache['devices'])
                await viz_manager.broadcast_device_update({
                    'id': device.get('device_id', f"device-{random.randint(1, 1000)}"),
                    'name': device.get('hostname', 'Unknown'),
                    'ip': device.get('ip_address', '0.0.0.0'),
                    'mac': device.get('mac_address', '00:00:00:00:00:00'),
                    'status': 'online',
                    'type': device.get('device_type', 'unknown'),
                    'threat_level': device.get('threat_level', 'low'),
                })
            elif random.random() > 0.7:
                device = await generate_mock_device()
                await viz_manager.broadcast_device_update(device)
            
            # Emit traffic if available
            if real_data_cache['traffic'] and use_real:
                traffic = random.choice(real_data_cache['traffic'])
                await viz_manager.broadcast_wan_traffic({
                    'id': traffic.get('id', f"traffic-{random.randint(1, 1000)}"),
                    'source_ip': traffic.get('src_ip', '0.0.0.0'),
                    'dest_ip': traffic.get('dst_ip', '0.0.0.0'),
                    'protocol': traffic.get('protocol', 'TCP'),
                    'bytes': traffic.get('bytes', 0),
                    'threat_score': float(traffic.get('threat_score', 0)),
                })
            elif random.random() > 0.3:
                traffic = await generate_mock_wan_traffic()
                await viz_manager.broadcast_wan_traffic(traffic)
            
            # Emit threat if available
            if real_data_cache['threats'] and use_real:
                threat = random.choice(real_data_cache['threats'])
                await viz_manager.broadcast_threat_event({
                    'id': threat.get('id', f"threat-{random.randint(1, 1000)}"),
                    'type': threat.get('threat_type', 'Unknown'),
                    'severity': threat.get('severity', 'low'),
                    'source_ip': threat.get('source_ip', '0.0.0.0'),
                    'target_ip': threat.get('target_ip', '0.0.0.0'),
                    'description': threat.get('description', 'Threat detected'),
                })
            elif random.random() > 0.7:
                threat = await generate_mock_threat_event()
                await viz_manager.broadcast_threat_event(threat)
            
            await asyncio.sleep(random.uniform(0.5, 2))
        
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in real/mock data broadcaster: {e}")
            await asyncio.sleep(1)



# Global broadcaster tasks
broadcaster_tasks: Dict[str, asyncio.Task] = {}


@router.websocket("/ws")
async def websocket_visualization(websocket: WebSocket):
    """
    Main WebSocket endpoint for 3D visualization data.
    Client can subscribe to: device_update, wan_traffic, threat_event
    
    Example client:
    ws = new WebSocket('ws://localhost:8000/api/v1/ws');
    ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['device_update', 'wan_traffic', 'threat_event']
    }));
    """
    try:
        await viz_manager.connect(websocket)
        
        # Initialize broadcasters on first connection
        if not broadcaster_tasks:
            broadcaster_tasks['integrated'] = asyncio.create_task(integrate_real_and_mock_data())
            logger.info("Real/Mock data broadcaster started")
        
        # Send connection confirmation
        await viz_manager.send_message(websocket, {
            "type": "connection",
            "status": "connected",
            "message": "Connected to visualization stream",
            "available_channels": ["device_update", "wan_traffic", "threat_event"]
        })
        
        # Handle client messages
        try:
            while True:
                data = await websocket.receive_json()
                
                if data.get("type") == "subscribe":
                    # Subscribe to channels
                    channels = data.get("channels", [])
                    
                    if "device_update" in channels:
                        viz_manager.lan_subscribers.add(websocket)
                    if "wan_traffic" in channels:
                        viz_manager.wan_subscribers.add(websocket)
                    if "threat_event" in channels:
                        viz_manager.threat_subscribers.add(websocket)
                    
                    await viz_manager.send_message(websocket, {
                        "type": "subscription_ack",
                        "subscribed_channels": channels,
                        "timestamp": datetime.now().timestamp()
                    })
                    
                elif data.get("type") == "unsubscribe":
                    # Unsubscribe from channels
                    channels = data.get("channels", [])
                    
                    if "device_update" in channels:
                        viz_manager.lan_subscribers.discard(websocket)
                    if "wan_traffic" in channels:
                        viz_manager.wan_subscribers.discard(websocket)
                    if "threat_event" in channels:
                        viz_manager.threat_subscribers.discard(websocket)
                    
                elif data.get("type") == "ping":
                    await viz_manager.send_message(websocket, {
                        "type": "pong",
                        "timestamp": datetime.now().timestamp()
                    })
        
        except WebSocketDisconnect:
            logger.info("Visualization WebSocket client disconnected")
            viz_manager.disconnect(websocket)
        
    except Exception as e:
        logger.error(f"Visualization WebSocket error: {e}")
        viz_manager.disconnect(websocket)


@router.get("/visualization/status", tags=["Visualization"])
async def get_visualization_status():
    """Get current visualization stream status."""
    return {
        "status": "operational",
        "active_connections": len(viz_manager.active_connections),
        "lan_subscribers": len(viz_manager.lan_subscribers),
        "wan_subscribers": len(viz_manager.wan_subscribers),
        "threat_subscribers": len(viz_manager.threat_subscribers),
        "broadcasters_running": bool(broadcaster_tasks),
    }
