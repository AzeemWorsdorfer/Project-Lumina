import os

from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import auth, ingestion, study

app: FastAPI = FastAPI(title="Lumina API")

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Connect our new routers
app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
app.include_router(ingestion.router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(study.router, prefix="/api/v1", tags=["Study Session"])


@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint returning API status."""
    try:
        return {"message": "Lumina API is live"}
    except Exception as e:
        # Log error and return fallback response
        print(f"Error in root endpoint: {e}")
        return {"message": "API service unavailable"}
