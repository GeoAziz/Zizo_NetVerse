# src/backend/main.py

from fastapi import FastAPI
from api_gateway.endpoints import auth, logs
from core.config import settings
from services import firebase_admin
from starlette.middleware.cors import CORSMiddleware

# Initialize Firebase Admin SDK
firebase_admin.initialize_firebase_admin()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Zizo_NetVerse Backend Engine!"}


# Include routers from the api_gateway
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Auth"])
app.include_router(logs.router, prefix=settings.API_V1_STR, tags=["Logs"])

# Placeholder for starting the network capture service in the background
# In a real production environment, this would be managed by a process manager like systemd
# from services.network_capture import start_capture
# import asyncio

# @app.on_event("startup")
# async def startup_event():
#     print("Starting network capture service...")
#     # This is a simplified way to run a background task.
#     # For a real app, use something more robust like Celery or asyncio.create_task
#     # with proper task management.
#     asyncio.create_task(start_capture())
