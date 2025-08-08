# Zizo_NetVerse Backend Startup Guide

This document explains the backend startup process for the Zizo_NetVerse cybersecurity command deck. It covers what happens when you launch the backend, what each log message means, and how to verify that your system is running correctly.

---

## 1. Prerequisites

Before starting the backend, ensure you have:
- Installed all system and Python dependencies (see `install_dependencies.sh` or `setup.sh`)
- Configured your environment variables for Railway, or your `.env` file for local development.
- For local development, place your Firebase service account key at `src/backend/core/serviceAccountKey.json`.
- For cloud deployment, set the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with the contents of your key file.

---

## 2. Starting the Backend

You can start the backend using either the provided script or directly with Uvicorn:

### Using the Dev Script (Local)
```bash
cd src/backend
bash run_dev.sh
```

### Using Uvicorn Directly (Local)
```bash
cd src/backend
source venv/bin/activate
# Note: Packet capture might require root privileges
sudo python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
> **Note:** Packet capture requires root privileges (`sudo`) on most systems.

---

## 3. What Happens on Startup (Log Analysis)

When you start the backend, you should see log messages like the following:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [1] using WatchFiles
INFO:     Started server process [5]
INFO:     Waiting for application startup.
INFO:main:🔥 Starting Zizo_NetVerse Backend Engine...
INFO:services.firebase_admin:Firebase Admin SDK initialized successfully...
INFO:services.message_queue:Redis connection established successfully
INFO:main:✅ Message queue initialized
INFO:main:🎯 Starting packet capture service...
INFO:main:🚀 All services initialized successfully!
INFO:services.network_capture:Starting packet capture on interface: eth0
INFO:     Application startup complete.
```

### What Each Message Means
- **`Firebase Admin SDK initialized...`**: Success! The backend can now verify user tokens and manage authentication.
- **`Redis connection established...`**: Success! The backend connected to the Redis server for message queuing.
- **`🔥 Starting Zizo_NetVerse Backend Engine...`**: The main FastAPI app is initializing its startup routines.
- **`🎯 Starting packet capture service...`**: The backend is preparing to capture network packets.
- **`Starting packet capture on interface: <name>`**: The backend is now sniffing packets on the specified network interface.
- **`Application startup complete.`**: FastAPI has finished all startup routines and the API is ready.
- **`Uvicorn running on http://0.0.0.0:8000`**: The backend is live and ready to accept requests.

---

## 4. Troubleshooting Common Errors

- **`ERROR:services.firebase_admin:Failed to initialize Firebase...`**
    - **Cause:** The app can't find your Firebase credentials.
    - **Solution (Cloud):** Ensure the `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIREBASE_PROJECT_ID` environment variables are set correctly for the service.
    - **Solution (Local):** Ensure `core/serviceAccountKey.json` exists and is valid.

- **`ERROR:services.message_queue:Failed to connect to Redis...`**
    - **Cause:** The backend can't reach the Redis server.
    - **Solution:** Check that your `REDIS_URL` environment variable is correct for your cloud/local setup. Ensure the Redis server is running and accessible.

- **`ERROR:services.network_capture:Interface <name> not found...`**
    - **Cause:** The network interface specified in `NETWORK_INTERFACE` doesn't exist in the container/machine.
    - **Solution:** Set the `NETWORK_INTERFACE` environment variable to a valid interface name (e.g., `railnet0` on Railway, `eth0` on many VMs, or `en0` on macOS).

- **`pydantic...ValidationError`**
    - **Cause:** Required environment variables are missing. The error message will list which ones.
    - **Solution:** Add the missing environment variables to your cloud service configuration or your local `.env` file.

---

## 5. Next Steps

- Visit `http://<your_backend_url>/docs` for interactive API documentation.
- Use the frontend (Next.js app) to interact with the backend.
- Monitor logs for any errors or warnings.

---

For more details, see the main [README.md](../README.md) and [backend-architecture.md](./backend-architecture.md).
