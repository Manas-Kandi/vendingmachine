"""FastAPI entry point for the Zen Machine AI Economy."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .live_engine import LiveEngine

app = FastAPI(title="Zen Machine Economy")

# Allow CORS for local UI development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = LiveEngine()

@app.get("/health")
async def health_check():
    """Return system health status."""
    return {"status": "ok", "mode": "AI Economy"}

@app.get("/telemetry")
async def get_telemetry():
    """Get the current state of the AI economy."""
    snapshot = await engine.snapshot()
    return snapshot
