"""Zen Agent implementation with Mistral-7B integration."""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
import cvxpy as cp
from dataclasses import dataclass

from ..core.models import (
    InventoryState,
    EnvironmentalData,
    ZenDecision,
    SKU,
)
from .demand_model import DemandModel
from .optimization_engine import OptimizationEngine
from .llm_interface import LLMInterface

logger = logging.getLogger(__name__)


@dataclass
class ZenAgentConfig:
    """Configuration for Zen Agent."""
    
    model_path: str = "mistral-7b-instruct-v0.3.Q4_K_M.gguf"
    context_length: int = 8192
    temperature: float = 0.1
    max_tokens: int = 512
    price_bounds: tuple = (0.95, 1.05)  # ±5% of MSRP
    max_order_qty: int = 99
    optimization_timeout: float = 0.1  # 100ms
    stockout_threshold: float = 0.05  # 5% probability


class ZenAgent:
    """AI-powered vending machine operator."""
    
    def __init__(self, config: ZenAgentConfig):
        self.config = config
        self.demand_model = DemandModel()
        self.optimizer = OptimizationEngine(config)
        self.llm = LLMInterface(config)
        self.memory = []  # 7-day rolling memory
        
    async def make_decision(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU]
    ) -> ZenDecision:
        """Make pricing and restocking decision."""
        
        try:
            # Prepare context for LLM
            context = self._prepare_context(inventory, environment, sku_list)
            
            # Get LLM reasoning
            llm_response = await self.llm.generate_decision(context)
            
            # Optimize prices and orders
            optimized_decision = await self.optimizer.optimize(
                inventory=inventory,
                environment=environment,
                sku_list=sku_list,
                llm_suggestion=llm_response
            )
            
            # Update memory
            self._update_memory(context, optimized_decision)
            
            return optimized_decision
            
        except Exception as e:
            logger.error(f"Error in Zen decision making: {e}")
            # Fallback to simple heuristic
            return self._fallback_decision(inventory, environment, sku_list)
    
    def _prepare_context(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU]
    ) -> Dict:
        """Prepare context for LLM decision making."""
        
        # Calculate key metrics
        total_stock = sum(inventory.stock_levels.values())
        low_stock_skus = [
            sku.id for sku in sku_list
            if inventory.stock_levels.get(sku.id, 0) < 5
        ]
        
        # Demand forecasts
        demand_forecasts = {}
        for sku in sku_list:
            forecast = self.demand_model.predict_demand(
                sku=sku,
                environment=environment,
                current_price=sku.msrp  # Use MSRP as baseline
            )
            demand_forecasts[sku.id] = forecast
        
        return {
            "timestamp": environment.timestamp.isoformat(),
            "inventory": {
                "total_stock": total_stock,
                "low_stock_skus": low_stock_skus,
                "days_since_restock": inventory.days_since_restock,
                "stock_levels": inventory.stock_levels
            },
            "environment": {
                "temperature": environment.temperature_c,
                "rain": environment.rain_mm,
                "traffic": environment.traffic_count,
                "hour": environment.hour,
                "weekday": environment.weekday,
                "holiday": environment.holiday_flag
            },
            "demand_forecasts": demand_forecasts,
            "memory_summary": self._get_memory_summary()
        }
    
    def _update_memory(self, context: Dict, decision: ZenDecision):
        """Update rolling memory with new decision."""
        
        memory_entry = {
            "timestamp": decision.timestamp,
            "context": context,
            "decision": {
                "prices": decision.prices,
                "order": decision.order,
                "expedite": decision.expedite,
                "thought": decision.thought
            }
        }
        
        self.memory.append(memory_entry)
        
        # Keep only last 7 days
        cutoff_time = decision.timestamp - timedelta(days=7)
        self.memory = [
            entry for entry in self.memory
            if entry["timestamp"] > cutoff_time
        ]
    
    def _get_memory_summary(self) -> Dict:
        """Get summary of recent memory for context."""
        
        if not self.memory:
            return {"recent_decisions": 0, "avg_margin": 0.0}
        
        recent_decisions = len(self.memory)
        # Simplified margin calculation from memory
        avg_margin = 0.15  # Placeholder
        
        return {
            "recent_decisions": recent_decisions,
            "avg_margin": avg_margin,
            "last_restock": self.memory[-1]["timestamp"] if self.memory else None
        }
    
    def _fallback_decision(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU]
    ) -> ZenDecision:
        """Simple heuristic fallback decision."""
        
        prices = {}
        orders = {}
        
        for sku in sku_list:
            stock = inventory.stock_levels.get(sku.id, 0)
            
            # Simple pricing: lower price if low stock
            if stock < 3:
                prices[sku.id] = sku.msrp * 1.05  # Premium for scarcity
            elif stock > 20:
                prices[sku.id] = sku.msrp * 0.95  # Discount for excess
            else:
                prices[sku.id] = sku.msrp
                
            # Simple ordering: reorder if low stock
            if stock < 10:
                orders[sku.id] = 20 - stock
            else:
                orders[sku.id] = 0
                
        return ZenDecision(
            prices=prices,
            order=orders,
            expedite=False,
            thought="Fallback heuristic: price based on stock levels"
        )
