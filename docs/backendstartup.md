# Zizo_NetVerse Backend Startup Guide

This document explains the backend startup process for the Zizo_NetVerse cybersecurity command deck. It covers what happens when you launch the backend, what each log message means, and how to verify that your system is running correctly.

---

## 1. Prerequisites

Before starting the backend, ensure you have:
- Installed all system and Python dependencies (see `install_dependencies.sh` or `setup.sh`)
- Configured your `.env` file with the correct environment variables (Firebase, InfluxDB, Redis, etc.)
- Placed your Firebase service account key at `src/backend/core/serviceAccountKey.json`

---

## 2. Starting the Backend

You can start the backend using either the provided script or directly with Uvicorn:

### Using the Dev Script
```bash
cd src/backend
bash run_dev.sh
```

### Using Uvicorn Directly
```bash
cd src/backend
source venv/bin/activate
sudo python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
> **Note:** Root privileges (`sudo`) are required for packet capture on most systems.

---

## 3. What Happens on Startup

When you start the backend, you should see log messages like the following:

```
INFO:services.firebase_admin:Firebase Admin SDK initialized successfully using service account file.
INFO:     Started server process [1201575]
INFO:     Waiting for application startup.
INFO:main:🔥 Starting Zizo_NetVerse Backend Engine...
INFO:services.message_queue:Redis connection established successfully
INFO:main:✅ Message queue initialized
INFO:main:🎯 Starting packet capture service...
INFO:main:🚀 All services initialized successfully!
INFO:services.network_capture:Starting packet capture on interface: eth0
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### What Each Message Means
- **Firebase Admin SDK initialized...**: The backend can now verify user tokens and manage authentication.
- **Started server process...**: Uvicorn has started the FastAPI server process.
- **Waiting for application startup.**: Uvicorn is waiting for FastAPI's startup events to finish.
- **🔥 Starting Zizo_NetVerse Backend Engine...**: The main FastAPI app is initializing.
- **Redis connection established...**: The backend connected to the Redis server for message queuing.
- **✅ Message queue initialized**: The message queue service is ready.
- **🎯 Starting packet capture service...**: The backend is preparing to capture network packets.
- **🚀 All services initialized successfully!**: All core backend services are up and running.
- **Starting packet capture on interface: eth0**: The backend is now sniffing packets on the specified network interface.
- **Application startup complete.**: FastAPI has finished all startup routines.
- **Uvicorn running on http://0.0.0.0:8000**: The backend is live and ready to accept requests.

---

## 4. Troubleshooting

- **Permission denied: Please run with root/administrator privileges**
    - Solution: Use `sudo` when starting the backend to allow packet capture.
- **No module named 'firebase_admin'**
    - Solution: Run `pip install -r requirements.txt` inside your virtual environment.
- **Service account key not found**
    - Solution: Place your Firebase service account key at `src/backend/core/serviceAccountKey.json`.
- **Redis/InfluxDB connection errors**
    - Solution: Ensure Redis and InfluxDB are installed, running, and accessible. See the install/setup scripts for details.

---

## 5. Next Steps

- Visit [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API documentation.
- Use the frontend (Next.js app) to interact with the backend.
- Monitor logs for any errors or warnings.

---

For more details, see the main [README.md](../README.md) and [backend-architecture.md](./backend-architecture.md).
