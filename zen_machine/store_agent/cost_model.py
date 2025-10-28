"""Cost model for Store Agent pricing."""

import logging
from typing import Dict
import numpy as np

from ..core.models import SKU

logger = logging.getLogger(__name__)


class CostModel:
    """Supplier cost model with environmental factors."""
    
    def __init__(self, config):
        self.config = config
        
        # Base costs for SKUs (wholesale prices)
        self.base_costs = {
            "water": 0.50,
            "soda": 0.75,
            "juice": 1.20,
            "energy": 1.50,
            "snack": 0.80,
            "candy": 0.60,
            "healthy": 1.80
        }
        
        # Current market conditions
        self.diesel_price = 1.45  # €/liter
        self.temperature_factor = 1.0
        
    def calculate_cost(self, sku_id: str, quantity: int, urgency: bool = False) -> float:
        """Calculate total cost for SKU and quantity."""
        
        # Base cost
        base_cost = self.base_costs.get(sku_id, 1.0)
        
        # Diesel price adjustment
        diesel_adjustment = self._calculate_diesel_adjustment()
        
        # Temperature factor (for frozen/refrigerated items)
        temp_adjustment = self._calculate_temperature_adjustment(sku_id)
        
        # Quantity discount
        quantity_discount = self._calculate_quantity_discount(quantity)
        
        # Urgency premium
        urgency_premium = 1.0
        if urgency:
            urgency_premium = 1.2  # 20% premium for expedited orders
        
        # Calculate unit cost
        unit_cost = (
            base_cost * 
            diesel_adjustment * 
            temp_adjustment * 
            quantity_discount * 
            urgency_premium
        )
        
        # Total cost
        total_cost = unit_cost * quantity
        
        return total_cost
    
    def _calculate_diesel_adjustment(self) -> float:
        """Calculate cost adjustment based on diesel prices."""
        
        # Knee function: minimal impact below threshold, linear above
        if self.diesel_price <= self.config.diesel_price_knee:
            return 1.0
        else:
            excess = self.diesel_price - self.config.diesel_price_knee
            return 1.0 + (excess * 0.1)  # 10% increase per € above knee
    
    def _calculate_temperature_adjustment(self, sku_id: str) -> float:
        """Calculate temperature adjustment for temperature-sensitive items."""
        
        # Identify temperature-sensitive SKUs
        temp_sensitive = ["juice", "energy", "healthy"]
        
        if any(ts in sku_id.lower() for ts in temp_sensitive):
            # Higher costs for refrigeration
            return 1.0 + (self.temperature_factor - 1.0) * 0.15
        
        return 1.0
    
    def _calculate_quantity_discount(self, quantity: int) -> float:
        """Calculate quantity discount."""
        
        if quantity >= 50:
            return 0.85  # 15% discount for large orders
        elif quantity >= 20:
            return 0.90  # 10% discount for medium orders
        elif quantity >= 10:
            return 0.95  # 5% discount for small orders
        else:
            return 1.0  # No discount
    
    def update_market_conditions(self, diesel_price: float = None, 
                               temperature_factor: float = None):
        """Update market condition parameters."""
        
        if diesel_price is not None:
            self.diesel_price = diesel_price
        
        if temperature_factor is not None:
            self.temperature_factor = temperature_factor
    
    def get_cost_breakdown(self, sku_id: str, quantity: int, urgency: bool = False) -> Dict:
        """Get detailed cost breakdown."""
        
        base_cost = self.base_costs.get(sku_id, 1.0)
        diesel_adj = self._calculate_diesel_adjustment()
        temp_adj = self._calculate_temperature_adjustment(sku_id)
        qty_discount = self._calculate_quantity_discount(quantity)
        urgency_adj = 1.2 if urgency else 1.0
        
        unit_cost = base_cost * diesel_adj * temp_adj * qty_discount * urgency_adj
        total_cost = unit_cost * quantity
        
        return {
            "base_cost": base_cost,
            "diesel_adjustment": diesel_adj,
            "temperature_adjustment": temp_adj,
            "quantity_discount": qty_discount,
            "urgency_premium": urgency_adj,
            "unit_cost": unit_cost,
            "total_cost": total_cost,
            "quantity": quantity
        }
