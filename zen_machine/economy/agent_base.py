import asyncio
import logging
import uuid
import random
from typing import Dict, List, Optional
from dataclasses import dataclass

from ..core.llm_interface import UnifiedLLMInterface
from .market import Order, Market

logger = logging.getLogger(__name__)

@dataclass
class AgentState:
    cash: float
    assets: Dict[str, int]
    persona: str
    strategy: str

class EconomicAgent:
    def __init__(self, persona: str, strategy: str, initial_cash: float = 1000.0):
        self.id = str(uuid.uuid4())[:8]
        self.persona = persona
        self.strategy = strategy
        self.cash = initial_cash
        self.assets = {
            "COMPUTE": 10,
            "DATA": 10,
            "ENERGY": 10
        }
        self.llm = UnifiedLLMInterface(
            system_prompt=self._build_system_prompt(),
            temperature=0.4
        )
        self.memory: List[Dict] = []

    def _build_system_prompt(self) -> str:
        return f"""You are an autonomous economic agent in a digital economy.
Your ID: {self.id}
Persona: {self.persona}
Strategy: {self.strategy}

You trade three assets: COMPUTE, DATA, ENERGY.
Your goal is to maximize your total portfolio value (Cash + Asset Value).

Output your decision in JSON format:
{{
    "thought": "Reasoning for your action...",
    "action": "buy" | "sell" | "hold",
    "asset": "COMPUTE" | "DATA" | "ENERGY",
    "price": <float>,
    "quantity": <int>
}}
"""

    async def act(self, market: Market) -> Optional[Order]:
        # 1. Observe Market
        market_state = market.get_state()
        
        # 2. Construct Context
        context = {
            "portfolio": {
                "cash": self.cash,
                "assets": self.assets
            },
            "market": market_state,
            "last_action": self.memory[-1] if self.memory else None
        }
        
        # 3. Decide (Mock LLM for speed/reliability in this demo phase, or real LLM)
        # For now, we'll use a heuristic + random noise to simulate "personas" 
        # until we wire up the full LLM loop efficiently.
        decision = self._heuristic_decision(market_state)
        
        # 4. Execute
        if decision["action"] == "hold":
            return None
            
        order = Order(
            id=str(uuid.uuid4()),
            agent_id=self.id,
            asset=decision["asset"],
            side=decision["action"],
            price=decision["price"],
            quantity=decision["quantity"],
            timestamp=0.0 # Set by market or caller
        )
        
        # Validate funds/assets
        if order.side == "buy":
            cost = order.price * order.quantity
            if cost > self.cash:
                # Adjust quantity
                order.quantity = int(self.cash // order.price)
                
        elif order.side == "sell":
            available = self.assets.get(order.asset, 0)
            if order.quantity > available:
                order.quantity = available
                
        if order.quantity <= 0:
            return None
            
        return order

    def _heuristic_decision(self, market_state: Dict) -> Dict:
        """Temporary heuristic to drive simulation without waiting for LLM latency."""
        assets = ["COMPUTE", "DATA", "ENERGY"]
        target_asset = random.choice(assets)
        last_price = market_state["last_prices"][target_asset]
        
        action = "hold"
        price = last_price
        qty = 1
        
        if self.persona == "Whale":
            # Buys large chunks, holds
            if random.random() < 0.2:
                action = "buy"
                price = last_price * random.uniform(0.98, 1.05)
                qty = random.randint(5, 20)
            elif random.random() < 0.05:
                 action = "sell"
                 price = last_price * random.uniform(0.95, 1.02)
                 qty = random.randint(5, 20)
                 
        elif self.persona == "Scalper":
            # Frequent small trades
            if random.random() < 0.6:
                action = random.choice(["buy", "sell"])
                spread = random.uniform(0.99, 1.01)
                price = last_price * spread
                qty = random.randint(1, 3)
                
        elif self.persona == "HODLer":
            # Mostly buys
            if random.random() < 0.3:
                action = "buy"
                price = last_price * random.uniform(0.90, 1.0) # Lowball
                qty = random.randint(1, 5)
            elif random.random() < 0.05:
                action = "sell"
                price = last_price * 1.5 # Moon price
                qty = 1

        return {
            "thought": f"Acting as {self.persona}...",
            "action": action,
            "asset": target_asset,
            "price": round(price, 2),
            "quantity": qty
        }

    def update_wallet(self, trade: 'Trade', role: str):
        if role == "buyer":
            self.cash -= trade.price * trade.quantity
            self.assets[trade.asset] += trade.quantity
        else:
            self.cash += trade.price * trade.quantity
            self.assets[trade.asset] -= trade.quantity
