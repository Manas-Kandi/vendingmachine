"""FastAPI application providing live telemetry for the UI."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .live_engine import LiveEngine

app = FastAPI(
    title="Zen Machine API",
    version="0.2.0",
    description="Live telemetry and decision feed for the Zen Machine frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = LiveEngine()


@app.get("/health")
async def health() -> dict:
    """Simple health probe."""
    return {"status": "ok"}


@app.get("/telemetry")
async def telemetry() -> dict:
    """Return the latest telemetry snapshot."""
    try:
        snapshot = await engine.snapshot()
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "metrics": snapshot.metrics,
        "marginSeries": snapshot.margin_series,
        "timeline": snapshot.timeline,
        "reasoning": snapshot.reasoning,
        "generatedAt": snapshot.generated_at.isoformat(),
        "inventory": snapshot.inventory,
        "orders": snapshot.orders,
        "status": snapshot.status,
    }
