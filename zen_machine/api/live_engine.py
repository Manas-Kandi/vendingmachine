"""Live economy engine that powers the public API."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from ..economy.market import Market, Trade
from ..economy.agent_base import EconomicAgent

@dataclass
class Snapshot:
    """Telemetry snapshot returned to the API layer."""
    generated_at: datetime
    market_state: Dict
    agents: List[Dict]
    trades: List[Dict]
    status: str

class LiveEngine:
    """Maintains the continuous AI economy simulation."""

    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.market = Market()
        self.agents: List[EconomicAgent] = [
            EconomicAgent("Whale", "Accumulate assets", initial_cash=50000),
            EconomicAgent("Scalper", "High frequency arbitrage", initial_cash=5000),
            EconomicAgent("Scalper", "Momentum trading", initial_cash=5000),
            EconomicAgent("HODLer", "Long term store of value", initial_cash=2000),
            EconomicAgent("PanicSeller", "Risk averse", initial_cash=3000),
        ]
        self.recent_trades: List[Trade] = []

    async def snapshot(self) -> Snapshot:
        async with self.lock:
            return await self._step()

    async def _step(self) -> Snapshot:
        timestamp = datetime.utcnow()
        
        # 1. Agents Act
        new_trades = []
        for agent in self.agents:
            order = await agent.act(self.market)
            if order:
                order.timestamp = time.time()
                trades = self.market.place_order(order)
                
                # Update wallets
                for trade in trades:
                    # Find buyer and seller
                    buyer = next((a for a in self.agents if a.id == trade.buyer_id), None)
                    seller = next((a for a in self.agents if a.id == trade.seller_id), None)
                    
                    if buyer: buyer.update_wallet(trade, "buyer")
                    if seller: seller.update_wallet(trade, "seller")
                
                new_trades.extend(trades)

        self.recent_trades.extend(new_trades)
        # Keep recent history manageable
        if len(self.recent_trades) > 50:
            self.recent_trades = self.recent_trades[-50:]

        # 2. Compose Snapshot
        market_state = self.market.get_state()
        
        agent_views = []
        for agent in self.agents:
            total_value = agent.cash
            for asset, qty in agent.assets.items():
                total_value += qty * market_state["last_prices"].get(asset, 0)
                
            agent_views.append({
                "id": agent.id,
                "persona": agent.persona,
                "cash": round(agent.cash, 2),
                "assets": agent.assets,
                "total_value": round(total_value, 2)
            })

        trade_views = [
            {
                "id": t.id,
                "asset": t.asset,
                "price": round(t.price, 2),
                "qty": t.quantity,
                "buyer": t.buyer_id[:4],
                "seller": t.seller_id[:4],
                "time": datetime.fromtimestamp(t.timestamp).isoformat()
            }
            for t in reversed(new_trades) # Send newest first
        ]

        return Snapshot(
            generated_at=timestamp,
            market_state=market_state,
            agents=agent_views,
            trades=trade_views,
            status="Active"
        )
