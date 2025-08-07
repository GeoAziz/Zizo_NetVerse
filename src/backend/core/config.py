# src/backend/core/config.py

from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zizo_NetVerse Backend"
    API_V1_STR: str = "/api/v1"

    # Backend CORS origins
    # A list of origins that should be permitted to make cross-origin requests.
    # e.g. ["http://localhost:3000", "https://your-frontend.vercel.app"]
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Firebase Admin SDK credentials
    # The path to the service account key file.
    # This path is relative to the root directory where you run the backend (src/backend).
    GOOGLE_APPLICATION_CREDENTIALS: str = "core/serviceAccountKey.json"

    class Config:
        case_sensitive = True
        # Reads from a .env file in the same directory
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
