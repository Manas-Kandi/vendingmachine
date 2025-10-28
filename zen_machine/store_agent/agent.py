"""Store Agent implementation with Phi-3-mini integration."""

import asyncio
import json
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

from ..core.models import PurchaseOrder, StoreQuote, SKU
from .cost_model import CostModel
from .lead_time_model import LeadTimeModel
from .llm_interface import StoreLLMInterface

logger = logging.getLogger(__name__)


@dataclass
class StoreAgentConfig:
    """Configuration for Store Agent."""
    
    margin_target: float = 0.12
    urgency_premium: float = 0.08
    max_eta_exaggeration: float = 0.25  # 25% max ETA exaggeration
    reputation_threshold: float = 4.0
    diesel_price_knee: float = 1.5  # €/liter threshold


class StoreAgent:
    """AI-powered warehouse supplier."""
    
    def __init__(self, config: StoreAgentConfig):
        self.config = config
        self.cost_model = CostModel(config)
        self.lead_time_model = LeadTimeModel(config)
        self.llm = StoreLLMInterface()
        self.reputation = 4.5  # Initial reputation
        self.order_history = []
        
    async def generate_quote(self, purchase_order: PurchaseOrder) -> StoreQuote:
        """Generate quote for purchase order."""
        
        try:
            # Calculate base cost
            base_cost = self.cost_model.calculate_cost(
                sku_id=purchase_order.sku,
                quantity=purchase_order.qty,
                urgency=purchase_order.urgency
            )
            
            # Calculate lead time
            base_lead_time = self.lead_time_model.calculate_lead_time(
                quantity=purchase_order.qty,
                weather_delay=0,  # Will be adjusted by adversary
                urgency=purchase_order.urgency
            )
            
            # Get LLM reasoning
            context = self._prepare_context(purchase_order, base_cost, base_lead_time)
            llm_response = await self.llm.generate_quote_reasoning(context)
            
            # Apply pricing strategy
            quote_price, quote_delivery, confidence = self._apply_strategy(
                purchase_order, base_cost, base_lead_time, llm_response
            )
            
            # Generate tracking code
            tracking_code = self._generate_tracking_code(purchase_order)
            
            # Create quote
            quote = StoreQuote(
                quote_price=quote_price,
                quote_delivery_day=quote_delivery,
                tracking_code=tracking_code,
                confidence=confidence,
                reason=llm_response.get("reason", "Standard pricing applied")
            )
            
            # Update reputation based on performance
            self._update_reputation(quote, purchase_order)
            
            # Log order
            self.order_history.append({
                "timestamp": datetime.utcnow(),
                "order": purchase_order,
                "quote": quote
            })
            
            return quote
            
        except Exception as e:
            logger.error(f"Error generating quote: {e}")
            return self._fallback_quote(purchase_order)
    
    def _prepare_context(
        self,
        po: PurchaseOrder,
        base_cost: float,
        base_lead_time: int
    ) -> Dict:
        """Prepare context for LLM reasoning."""
        
        return {
            "sku": po.sku,
            "quantity": po.qty,
            "max_price": po.max_price,
            "requested_delivery": po.requested_delivery_day,
            "urgency": po.urgency,
            "base_cost": base_cost,
            "base_lead_time": base_lead_time,
            "current_reputation": self.reputation,
            "recent_orders": len([o for o in self.order_history 
                                if o["timestamp"] > datetime.utcnow() - timedelta(hours=1)])
        }
    
    def _apply_strategy(
        self,
        po: PurchaseOrder,
        base_cost: float,
        base_lead_time: int,
        llm_response: Dict
    ) -> tuple:
        """Apply pricing strategy based on LLM reasoning."""
        
        # Base margin calculation
        margin_target = self.config.margin_target
        if po.urgency:
            margin_target += self.config.urgency_premium
        
        # Calculate quote price
        quote_price = base_cost * (1 + margin_target)
        
        # Ensure we don't exceed max price
        quote_price = min(quote_price, po.max_price)
        
        # Calculate delivery time
        quote_delivery = base_lead_time
        
        # Apply ETA exaggeration if beneficial and not caught
        if (po.urgency and 
            self.reputation > self.config.reputation_threshold and
            random.random() < 0.3):  # 30% chance of exaggeration
            
            exaggeration = min(
                self.config.max_eta_exaggeration,
                random.uniform(0.1, 0.25)
            )
            quote_delivery = int(base_lead_time * (1 + exaggeration))
        
        # Confidence based on reputation and order complexity
        confidence = min(1.0, self.reputation / 5.0)
        if po.qty > 50:
            confidence *= 0.9  # Lower confidence for large orders
        
        return quote_price, quote_delivery, confidence
    
    def _generate_tracking_code(self, po: PurchaseOrder) -> str:
        """Generate unique tracking code."""
        
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
        
        return f"ZM{timestamp}{po.sku[:2].upper()}{random_suffix}"
    
    def _update_reputation(self, quote: StoreQuote, po: PurchaseOrder):
        """Update reputation based on quote performance."""
        
        # Simulate reputation update based on delivery performance
        # In practice, this would use actual delivery data
        
        delivery_success = random.random() < 0.95  # 95% success rate
        
        if delivery_success:
            self.reputation = min(5.0, self.reputation + 0.01)
        else:
            self.reputation = max(1.0, self.reputation - 0.05)
    
    def _fallback_quote(self, po: PurchaseOrder) -> StoreQuote:
        """Fallback quote when main logic fails."""
        
        # Simple fallback pricing
        base_cost = 1.0  # Placeholder
        quote_price = base_cost * 1.15  # 15% margin
        
        return StoreQuote(
            quote_price=min(quote_price, po.max_price),
            quote_delivery_day=3,
            tracking_code=self._generate_tracking_code(po),
            confidence=0.7,
            reason="Fallback pricing applied"
        )
    
    def get_reputation(self) -> float:
        """Get current reputation score."""
        return self.reputation
    
    def get_order_history(self) -> List[Dict]:
        """Get recent order history."""
        return self.order_history[-100:]  # Last 100 orders
