# 🚀 Zizo_NetVerse Backend Engine

**Advanced Cybersecurity Command Deck** - A powerful, modular backend system for real-time network monitoring, threat intelligence analysis, and cybersecurity event management.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Automated Setup](#automated-setup)
  - [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Services](#services)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Zizo_NetVerse Backend Engine** is a comprehensive, enterprise-grade cybersecurity platform designed to provide:

- **Real-time Network Monitoring**: Live packet capture and analysis across your infrastructure
- **Threat Intelligence**: Integrated threat feed management and threat correlation
- **Security Events Management**: Centralized event aggregation and alerting
- **Advanced Analytics**: AI/ML-powered security analysis and anomaly detection
- **Access Control**: Firebase-based authentication with role-based access control (RBAC)
- **Network Proxy**: Built-in proxy engine for traffic inspection and manipulation
- **RESTful API**: Comprehensive REST API with WebSocket support for real-time data streaming

The system is built on a modular architecture, making it highly extensible and maintainable.

---

## ✨ Core Features

### 1. **Network Packet Capture & Analysis**
   - Real-time packet capture using Scapy
   - Protocol-level parsing (TCP, UDP, ICMP, etc.)
   - Structured data extraction and storage
   - Configurable network interface monitoring

### 2. **Network Logging & Time-Series Analytics**
   - InfluxDB integration for high-performance time-series storage
   - Temporal queries with granular filtering
   - Protocol-based filtering
   - Source/Destination IP-based filtering
   - Bulk log ingestion and retrieval

### 3. **Threat Intelligence Management**
   - Threat feed upload and management
   - Centralized threat data repository
   - Feed cataloging and organization

### 4. **Authentication & Authorization**
   - Firebase-based OAuth 2.0 authentication
   - Custom role-based access control (RBAC):
     - **Admin**: Full system access
     - **Analyst**: Analysis and monitoring capabilities
     - **Viewer**: Read-only access
   - Automatic role assignment for new users (first user = admin)
   - Token-based API authentication

### 5. **Alert System**
   - Webhook-based alert triggering
   - Real-time notification forwarding
   - Extensible alert routing

### 6. **Real-time Communication**
   - WebSocket endpoints for live data streaming
   - Real-time network log streaming
   - Pub/Sub messaging via Redis

### 7. **Device Management & Control**
   - Device discovery and registration
   - Remote device control capabilities
   - Device-level event tracking

### 8. **Proxy Engine**
   - Built-in HTTP/HTTPS proxy using mitmproxy
   - Traffic inspection and manipulation
   - Request/response logging and analysis

### 9. **Data Enrichment**
   - Automatic packet data enrichment
   - Context-aware security classification
   - Metadata extraction and correlation

### 10. **SIEM (Security Information & Event Management)**
   - Centralized event aggregation
   - Cross-system correlation
   - Security event dashboard integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           FastAPI Application (main.py)             │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         API Gateway & Endpoints               │  │
│  │                                               │  │
│  │  ├─ Authentication (auth.py)                 │  │
│  │  ├─ Network Logs (logs.py)                   │  │
│  │  ├─ Threat Feeds (threat_feeds.py)           │  │
│  │  ├─ SIEM Integration (siem.py)               │  │
│  │  ├─ Alerts (alerts.py)                       │  │
│  │  ├─ Proxy Management (proxy.py)              │  │
│  │  ├─ Device Management (devices.py)           │  │
│  │  ├─ Device Control (control_device.py)       │  │
│  │  ├─ User Management (users.py)               │  │
│  │  ├─ WebSocket Streaming (websockets.py)      │  │
│  │  └─ AI Analysis Placeholder (ai_analysis.py) │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         Core Services Layer                   │  │
│  │                                               │  │
│  │  ├─ Firebase Admin Auth                      │  │
│  │  ├─ InfluxDB Service                         │  │
│  │  ├─ Redis Message Queue                      │  │
│  │  ├─ Network Packet Capture (Scapy)           │  │
│  │  ├─ Data Enrichment Service                  │  │
│  │  └─ Proxy Engine (mitmproxy)                 │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         External Services                    │  │
│  │                                               │  │
│  │  ├─ Firebase (Auth & Firestore)              │  │
│  │  ├─ InfluxDB (Time-series Data)              │  │
│  │  ├─ Redis (Message Queue)                    │  │
│  │  └─ Network Interface (Packet Capture)       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
Network Traffic
    ↓
[Scapy Packet Capture] → Parse & Structure
    ↓
[Data Enrichment] → Add Context & Classification
    ↓
├─→ [InfluxDB] → Long-term Storage
├─→ [Redis Queue] → Real-time Streaming
└─→ [WebSocket] → Live Dashboard Updates
```

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | FastAPI | Modern async web framework for building APIs |
| **Authentication** | Firebase Admin SDK | OAuth 2.0 auth with Firestore integration |
| **Database** | InfluxDB | Time-series database for network logs |
| **Cache/Queue** | Redis | In-memory data structure store for messaging |
| **Packet Capture** | Scapy | Network packet manipulation and analysis |
| **Proxy** | mitmproxy | HTTP/HTTPS proxy for traffic inspection |
| **Server** | Uvicorn | ASGI web server for FastAPI |
| **Data Validation** | Pydantic | Data validation using Python type annotations |
| **Configuration** | Pydantic Settings | Environment-based configuration management |

---

## 📦 Prerequisites

- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Python**: 3.8 or higher
- **System Packages**:
  - `python3-dev` and `build-essential` for compilation
  - `libpcap-dev` for Scapy packet capture
  - `git` for version control
- **Services**:
  - Redis Server (for message queue)
  - InfluxDB 2.0+ (for time-series data storage)
  - Firebase Project (for authentication)

---

## 🚀 Installation

### Automated Setup

The easiest way to get started is using the provided setup scripts:

#### 1. Install System Dependencies

```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

This script installs:
- Python 3 and pip
- Redis Server
- InfluxDB
- Required system libraries

#### 2. Setup Backend Environment

```bash
chmod +x setup.sh
./setup.sh
```

This script:
- Creates a Python virtual environment
- Installs Python dependencies
- Configures InfluxDB
- Sets up proper permissions for packet capture

### Manual Setup

If you prefer to set up manually:

#### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and development tools
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install InfluxDB
curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
echo "deb https://repos.influxdata.com/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/influxdb.list
sudo apt update && sudo apt install -y influxdb2

# Install packet capture library
sudo apt install -y libpcap-dev
```

#### 2. Setup Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### 3. Configure InfluxDB

```bash
# Start InfluxDB
sudo systemctl start influxdb
sudo systemctl enable influxdb

# Setup InfluxDB (run these commands after InfluxDB starts)
influx setup \
  --username admin \
  --password your_secure_password \
  --org zizo-netverse \
  --bucket network-logs \
  --retention 0 \
  --force

# Generate API token
influx auth create \
  --org zizo-netverse \
  --all-access \
  --user admin
```

Copy the generated token to your `.env` file.

#### 4. Create Environment Configuration

```bash
# Create .env file in the project root
cat > .env << EOF
# Project Configuration
PROJECT_NAME=Zizo_NetVerse

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON=your-firebase-service-account-json
GEMINI_API_KEY=your-gemini-api-key

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=zizo-netverse
INFLUXDB_BUCKET=network-logs

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Network Capture Configuration
NETWORK_INTERFACE=eth0
CAPTURE_ENABLED=true

# CORS Configuration
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:9002
EOF
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# ========== PROJECT ==========
PROJECT_NAME=Zizo_NetVerse
API_V1_STR=/api/v1

# ========== FIREBASE ==========
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
GEMINI_API_KEY=your-gemini-api-key

# ========== INFLUXDB ==========
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=zizo-netverse
INFLUXDB_BUCKET=network-logs

# ========== REDIS ==========
REDIS_URL=redis://localhost:6379

# ========== NETWORK CAPTURE ==========
NETWORK_INTERFACE=eth0           # Default: eth0 (change based on your interface)
CAPTURE_ENABLED=true             # Set to false to disable packet capture

# ========== CORS ==========
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:9002
```

### Configuration File

See [core/config.py](core/config.py) for the complete configuration structure.

---

## 🎮 Running the Application

### Development Mode (with auto-reload)

```bash
chmod +x run_dev.sh
./run_dev.sh
```

Or manually:

```bash
# Activate virtual environment
source venv/bin/activate

# Run FastAPI with Uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode

```bash
# Activate virtual environment
source venv/bin/activate

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Access the Application

Once running, you can access:

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

**Note**: Packet capture requires elevated privileges:

```bash
sudo ./run_dev.sh
# or
sudo uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | User login with Firebase token |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `POST` | `/api/v1/auth/logout` | User logout |

### Network Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/logs/network` | Retrieve network logs with filtering |
| `GET` | `/api/v1/logs/network/{log_id}` | Get specific network log |
| `POST` | `/api/v1/logs/network/export` | Export logs in various formats |

**Query Parameters**:
- `limit`: Number of logs to return (1-1000, default: 100)
- `start_time`: ISO format timestamp (e.g., `2023-10-27T10:00:00Z`)
- `end_time`: ISO format timestamp
- `protocol`: Filter by protocol (TCP, UDP, ICMP)
- `source_ip`: Filter by source IP address
- `dest_ip`: Filter by destination IP address

### Threat Feeds

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/threat-feeds/upload` | Upload threat feed file |
| `GET` | `/api/v1/threat-feeds/list` | List available threat feeds |
| `GET` | `/api/v1/threat-feeds/{feed_id}` | Get specific threat feed |
| `DELETE` | `/api/v1/threat-feeds/{feed_id}` | Delete threat feed |

### SIEM

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/siem/events` | Get SIEM events |
| `POST` | `/api/v1/siem/correlate` | Run event correlation |
| `GET` | `/api/v1/siem/dashboard` | SIEM dashboard data |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/alerts/webhook` | Trigger webhook alert |
| `GET` | `/api/v1/alerts/history` | Get alert history |
| `PUT` | `/api/v1/alerts/{alert_id}/acknowledge` | Acknowledge alert |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/devices` | List all devices |
| `POST` | `/api/v1/devices` | Register new device |
| `GET` | `/api/v1/devices/{device_id}` | Get device details |
| `PUT` | `/api/v1/devices/{device_id}` | Update device |
| `DELETE` | `/api/v1/devices/{device_id}` | Delete device |
| `POST` | `/api/v1/devices/{device_id}/control` | Send control command |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users` | List users (admin only) |
| `POST` | `/api/v1/users/{user_id}/role` | Update user role (admin only) |
| `DELETE` | `/api/v1/users/{user_id}` | Delete user (admin only) |

### Proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/proxy/start` | Start proxy service |
| `POST` | `/api/v1/proxy/stop` | Stop proxy service |
| `GET` | `/api/v1/proxy/status` | Get proxy status |

### WebSockets

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/api/v1/ws/logs/network` | Stream network logs in real-time |
| `ws://localhost:8000/api/v1/ws/alerts` | Stream real-time alerts |
| `ws://localhost:8000/api/v1/ws/events` | Stream security events |

---

## 🔧 Services

### Core Services

#### 1. **Firebase Admin Service** (`services/firebase_admin.py`)
- Initializes Firebase Admin SDK
- Handles authentication and authorization
- Manages Firestore database connections

#### 2. **InfluxDB Service** (`services/database.py`)
- Time-series data storage and retrieval
- Network log persistence
- Query optimization for temporal data
- Bulk write operations

#### 3. **Message Queue Service** (`services/message_queue.py`)
- Redis-based pub/sub messaging
- Real-time packet data distribution
- Event broadcasting

#### 4. **Network Capture Service** (`services/network_capture.py`)
- Scapy-based packet sniffing
- Packet parsing and structured extraction
- Protocol-level analysis
- Async packet processing

#### 5. **Data Enrichment Service** (`services/enrichment.py`)
- Packet metadata extraction
- Context-aware classification
- Threat correlation
- Data normalization

#### 6. **Proxy Engine Service** (`services/proxy_engine.py`)
- mitmproxy integration
- HTTP/HTTPS traffic interception
- Request/response logging
- Traffic manipulation

---

## 📁 Project Structure

```
netverse-engine/
│
├── main.py                          # Application entry point & FastAPI setup
├── requirements.txt                 # Python dependencies
├── .env                            # Environment configuration (create this)
├── README.md                       # This file
│
├── api_gateway/                    # API endpoints and routing
│   └── endpoints/
│       ├── __init__.py
│       ├── auth.py                 # Authentication endpoints
│       ├── logs.py                 # Network log endpoints
│       ├── threat_feeds.py          # Threat intelligence management
│       ├── siem.py                 # SIEM integration
│       ├── alerts.py               # Alert management
│       ├── proxy.py                # Proxy control endpoints
│       ├── devices.py              # Device management
│       ├── control_device.py        # Device control commands
│       ├── users.py                # User management
│       ├── websockets.py           # WebSocket endpoints
│       └── ai_analysis.py          # AI analysis placeholder
│
├── services/                       # Business logic and external services
│   ├── __init__.py
│   ├── firebase_admin.py           # Firebase integration
│   ├── database.py                 # InfluxDB service
│   ├── message_queue.py            # Redis pub/sub service
│   ├── network_capture.py          # Packet capture service
│   ├── enrichment.py               # Data enrichment service
│   └── proxy_engine.py             # Proxy service
│
├── core/                           # Core utilities and configuration
│   ├── __init__.py
│   └── config.py                   # Settings and configuration
│
├── scripts/                        # Utility scripts
│   └── seed_users.py               # Database seeding script
│
├── setup.sh                        # Automated setup script
├── install_dependencies.sh         # System dependency installer
├── run_dev.sh                      # Development runner
│
└── tests/                          # Test files
    ├── test_backend.py
    ├── test_ai_lab.py
    ├── test_alerts.py
    ├── test_dashboard.py
    ├── test_device_inspector.py
    ├── test_enrichment.py
    ├── test_incident_reporting.py
    ├── test_network_logs.py
    ├── test_proxy_engine.py
    ├── test_siem.py
    └── test_threat_intel.py
```

---

## 👨‍💻 Development

### Setting Up Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/netverse-engine.git
cd netverse-engine

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file with your configuration
cp .env.example .env
# Edit .env with your settings

# 5. Run development server
chmod +x run_dev.sh
./run_dev.sh
```

### Code Organization Best Practices

1. **Endpoints**: Keep endpoint logic minimal, delegate to services
2. **Services**: Implement business logic and external service integration
3. **Configuration**: Use environment variables for all external service configuration
4. **Error Handling**: Use FastAPI's HTTPException for consistent error responses
5. **Logging**: Use Python's logging module for all log messages
6. **Type Hints**: Use Python type hints for better code clarity

### Adding New Endpoints

1. Create a new file in `api_gateway/endpoints/`
2. Define an APIRouter instance
3. Add your route handlers with proper type hints
4. Import and include the router in `main.py`

Example:

```python
# api_gateway/endpoints/my_feature.py
from fastapi import APIRouter, Depends
from api_gateway.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/my-feature/data", tags=["My Feature"])
async def get_feature_data(current_user: dict = Depends(get_current_user)):
    """Endpoint documentation"""
    return {"data": "example"}
```

Then in `main.py`:

```python
from api_gateway.endpoints import my_feature

app.include_router(my_feature.router, prefix=settings.API_V1_STR)
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest test_backend.py -v

# Run with coverage
python -m pytest --cov=. --cov-report=html
```

### Individual Service Tests

```bash
# Test backend services
python test_backend.py

# Test network logging
python test_network_logs.py

# Test SIEM functionality
python test_siem.py

# Test threat intelligence
python test_threat_intel.py

# Test alerts
python test_alerts.py

# Test proxy engine
python test_proxy_engine.py

# Test device inspector
python test_device_inspector.py

# Test enrichment service
python test_enrichment.py

# Test AI analysis
python test_ai_lab.py

# Test incident reporting
python test_incident_reporting.py

# Test dashboard
python test_dashboard.py
```

### Sample Test File

```python
#!/usr/bin/env python3
import asyncio
from services.message_queue import message_queue

async def test_message_queue():
    """Test Redis message queue functionality."""
    print("Testing Message Queue...")
    try:
        await message_queue.initialize()
        
        # Test publish
        test_data = {"test": "data", "timestamp": "2024-01-01T00:00:00Z"}
        success = await message_queue.publish_packet_data("test_channel", test_data)
        
        if success:
            print("✅ Message queue test passed")
        else:
            print("❌ Message queue test failed")
    except Exception as e:
        print(f"❌ Error: {e}")

# Run test
if __name__ == "__main__":
    asyncio.run(test_message_queue())
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **"Permission denied" error during packet capture**

```bash
# Run with sudo for packet capture privileges
sudo ./run_dev.sh

# Or run specific command with sudo
sudo uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. **Redis connection error: "Connection refused"**

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 3. **InfluxDB connection error**

```bash
# Check InfluxDB status
sudo systemctl status influxdb

# Start InfluxDB if needed
sudo systemctl start influxdb

# Verify connection
curl http://localhost:8086/api/v1/ping
```

#### 4. **Firebase initialization error: "Service account JSON not found"**

- Ensure `FIREBASE_SERVICE_ACCOUNT_JSON` is properly set in `.env`
- Download service account key from Firebase Console:
  - Go to Project Settings → Service Accounts
  - Click "Generate New Private Key"
  - Copy the entire JSON content to `.env`

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...",...}'
```

#### 5. **"Module not found" errors**

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### 6. **Network interface not found**

```bash
# List available network interfaces
ip link show
# or
ifconfig

# Update NETWORK_INTERFACE in .env with correct interface name
NETWORK_INTERFACE=eth0  # or wlan0, docker0, etc.
```

### Debug Mode

Enable debug logging:

```python
# In main.py or your endpoint files
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# This will show detailed logs
```

### Health Check

```bash
# Check API health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-03-26T10:30:00Z"}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear commit messages
4. **Write/update tests** for new functionality
5. **Submit a Pull Request** with a detailed description

### Coding Standards

- Follow PEP 8 style guide
- Use type hints for all functions
- Add docstrings to all functions and classes
- Keep functions focused and modular
- Write descriptive commit messages

### Commit Message Format

```
[FEATURE|FIX|DOCS|REFACTOR] Brief description

Detailed explanation of changes (if needed)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Support & Contact

- **Issues**: Please use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for feature requests
- **Email**: support@zizonetverse.com
- **Documentation**: Full API docs available at `/docs` when running

---

## 🚀 What's Next?

- [ ] Add comprehensive unit test coverage
- [ ] Implement dashboard frontend
- [ ] Add Kubernetes deployment configurations
- [ ] Expand threat intelligence integrations
- [ ] Implement machine learning anomaly detection
- [ ] Add multi-tenancy support
- [ ] Create admin management portal

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [InfluxDB Documentation](https://docs.influxdata.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Scapy Documentation](https://scapy.readthedocs.io/)
- [mitmproxy Documentation](https://docs.mitmproxy.org/)

---

## 🎉 Thank You!

Thank you for using **Zizo_NetVerse Backend Engine**. We're excited to have you on board! 🚀

For questions or feedback, please reach out to our support team.

**Happy Coding! 💻**

---

*Last Updated: March 26, 2026*
*Version: 1.0.0*