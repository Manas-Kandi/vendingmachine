#!/usr/bin/env python3
"""Simple Zen Machine demo without heavy dependencies."""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
import uvicorn

app = FastAPI(title="Zen Machine Demo", version="0.1.0")

class InventoryState(BaseModel):
    water: int = 20
    soda: int = 15
    snack: int = 25

class Decision(BaseModel):
    action: str
    sku: str
    quantity: int
    price: float
    reasoning: str

@app.get("/")
async def root():
    return {
        "message": "🧘 Zen Machine - Autonomous Vending AI",
        "status": "operational",
        "version": "0.1.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "zen-agent"}

@app.get("/inventory")
async def get_inventory():
    return {
        "inventory": {
            "water": 20,
            "soda": 15,
            "snack": 25
        },
        "timestamp": "2025-01-27T20:00:00Z"
    }

@app.post("/optimize")
async def optimize(inventory: InventoryState):
    """Make stocking decision based on current inventory."""
    # Simple demo logic
    if inventory.water < 10:
        decision = Decision(
            action="restock",
            sku="water",
            quantity=50,
            price=1.50,
            reasoning="Low water inventory detected. High demand expected."
        )
    elif inventory.snack < 15:
        decision = Decision(
            action="restock",
            sku="snack",
            quantity=30,
            price=1.75,
            reasoning="Snack inventory below threshold. Restocking recommended."
        )
    else:
        decision = Decision(
            action="hold",
            sku="none",
            quantity=0,
            price=0.0,
            reasoning="All inventory levels optimal. No action needed."
        )
    
    return {
        "decision": decision.dict(),
        "confidence": 0.85,
        "latency_ms": 45
    }

@app.get("/metrics")
async def get_metrics():
    return {
        "gross_margin": 0.21,
        "spoilage_rate": 0.006,
        "uptime": 0.985,
        "avg_latency_ms": 127,
        "total_revenue": 4250.50,
        "total_costs": 3357.90
    }

if __name__ == "__main__":
    print("🧘 Starting Zen Machine Demo...")
    print("📍 API will be available at: http://localhost:8000")
    print("📖 Docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
