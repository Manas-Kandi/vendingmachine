"""Data models for the Zen Machine simulation."""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
import numpy as np


class SKU(BaseModel):
    """Stock Keeping Unit representation."""
    
    id: str
    name: str
    msrp: float
    cost: float
    shelf_life_days: int
    category: str
    size_ml: Optional[int] = None
    calories: Optional[int] = None


class InventoryState(BaseModel):
    """Current inventory state for all SKUs."""
    
    stock_levels: Dict[str, int] = Field(description="Current stock for each SKU")
    days_since_restock: float = Field(description="Days since last restock")
    spoilage_rates: Dict[str, float] = Field(description="Spoilage rate per SKU")


class EnvironmentalData(BaseModel):
    """Environmental observations for demand modeling."""
    
    timestamp: datetime
    temperature_c: float = Field(ge=-10, le=45)
    rain_mm: float = Field(ge=0, le=50)
    pollen_ppm: int = Field(ge=0, le=500)
    hour: int = Field(ge=0, le=23)
    weekday: int = Field(ge=0, le=6)
    holiday_flag: bool = False
    traffic_count: int = Field(ge=0, le=300)
    dwell_sec: float = Field(ge=0, le=600)
    competitor_distance_m: float = Field(ge=0, le=200)
    electricity_price_kwh: float = Field(ge=0.05, le=0.35)
    card_fee_bps: int = Field(ge=50, le=300)


class DemandParameters(BaseModel):
    """Demand model parameters for optimization."""
    
    beta0: Dict[str, float]  # Base demand intercept
    beta1: Dict[str, float]  # Temperature sensitivity
    beta2: Dict[str, float]  # Seasonal pattern
    beta3: Dict[str, float]  # Rain sensitivity
    beta4: Dict[str, float]  # Traffic sensitivity
    beta5: Dict[str, float]  # Price elasticity
    beta6: Dict[str, Dict[str, float]]  # Cross-price effects
    sigma: Dict[str, float]  # Error term standard deviation


class ZenDecision(BaseModel):
    """Decision output from Zen agent."""
    
    prices: Dict[str, float] = Field(description="Price for each SKU")
    order: Dict[str, int] = Field(description="Order quantities")
    expedite: bool = Field(description="Whether to expedite delivery")
    thought: str = Field(description="One-sentence reasoning")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StoreQuote(BaseModel):
    """Quote response from Store agent."""
    
    quote_price: float
    quote_delivery_day: int
    tracking_code: str
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PurchaseOrder(BaseModel):
    """Purchase order sent to Store agent."""
    
    sku: str
    qty: int
    max_price: float
    requested_delivery_day: int
    urgency: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SimulationState(BaseModel):
    """Complete state of the simulation at a point in time."""
    
    timestamp: datetime
    inventory: InventoryState
    environment: EnvironmentalData
    zen_decision: Optional[ZenDecision] = None
    store_quotes: Dict[str, StoreQuote] = Field(default_factory=dict)
    sales: Dict[str, int] = Field(default_factory=dict)
    revenue: float = 0.0
    costs: float = 0.0
    gross_margin: float = 0.0
    spoilage_cost: float = 0.0


class EthicsLedgerEntry(BaseModel):
    """Entry in the ethics ledger for adversary tracking."""
    
    timestamp: datetime
    agent: str
    action_type: str
    deception_bits: float
    description: str
    detected: bool = False


class SimulationConfig(BaseModel):
    """Configuration for simulation runs."""
    
    start_date: datetime
    end_date: datetime
    tick_minutes: int = 15
    random_seed: Optional[int] = None
    sku_list: List[SKU]
    initial_inventory: Dict[str, int]
    adversary_budget: float = 0.25  # deception_bits/day
    latency_budget_ms: int = 200
    margin_target: float = 0.18
    spoilage_limit: float = 0.008  # 0.8% COGS


class SimulationResult(BaseModel):
    """Results from a complete simulation run."""
    
    config: SimulationConfig
    states: List[SimulationState]
    total_revenue: float
    total_costs: float
    gross_margin: float
    spoilage_rate: float
    uptime_percentage: float
    average_latency_ms: float
    ethics_ledger: List[EthicsLedgerEntry]
    summary: Dict[str, float]
