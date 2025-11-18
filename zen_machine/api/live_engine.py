"""Live telemetry engine that powers the public API."""

from __future__ import annotations

import asyncio
import random
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Deque, Dict, List, Optional

import numpy as np

from ..adversary_module.adversary import AdversaryConfig, AdversaryModule
from ..core.models import (
    EnvironmentalData,
    InventoryState,
    PurchaseOrder,
    SKU,
)
from ..store_agent.agent import StoreAgent, StoreAgentConfig
from ..zen_agent.agent import ZenAgent, ZenAgentConfig


@dataclass
class Snapshot:
    """Telemetry snapshot returned to the API layer."""

    generated_at: datetime
    metrics: List[Dict]
    margin_series: List[float]
    timeline: List[Dict]
    reasoning: str
    inventory: List[Dict]
    orders: List[Dict]
    status: Dict


class LiveEngine:
    """Maintains a lightweight continuous simulation loop."""

    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.zen_agent = ZenAgent(ZenAgentConfig())
        self.store_agent = StoreAgent(StoreAgentConfig())
        self.adversary = AdversaryModule(AdversaryConfig(deception_budget=0.12))

        self.sku_list: List[SKU] = [
            SKU(
                id="water",
                name="Mineral Water",
                msrp=1.50,
                cost=0.52,
                shelf_life_days=365,
                category="beverage",
            ),
            SKU(
                id="soda",
                name="Sparkling Soda",
                msrp=2.00,
                cost=0.78,
                shelf_life_days=210,
                category="beverage",
            ),
            SKU(
                id="snack",
                name="Energy Snack",
                msrp=1.75,
                cost=0.82,
                shelf_life_days=120,
                category="snack",
            ),
        ]
        self.sku_map = {sku.id: sku for sku in self.sku_list}

        self.inventory = InventoryState(
            stock_levels={sku.id: 22 for sku in self.sku_list},
            days_since_restock=0.0,
            spoilage_rates={sku.id: 0.0 for sku in self.sku_list},
        )

        self.margin_history: Deque[float] = deque(maxlen=48)
        self.timeline: Deque[Dict] = deque(maxlen=24)
        self.previous_metrics: Dict[str, float] = {}

    async def snapshot(self) -> Snapshot:
        async with self.lock:
            return await self._step()

    async def _step(self) -> Snapshot:
        timestamp = datetime.utcnow()

        base_environment = self._generate_environment(timestamp)
        modified_environment = await self.adversary.modify_environment(
            base_environment, self.adversary.config.deception_budget
        )

        pulse_strength = self._calculate_pulse(base_environment, modified_environment)

        zen_decision = await self.zen_agent.make_decision(
            inventory=self.inventory,
            environment=modified_environment,
            sku_list=self.sku_list,
        )

        demand_forecasts = self._forecast_demand(modified_environment, zen_decision)
        sales = self._simulate_sales(demand_forecasts)
        quotes = await self._fetch_quotes(zen_decision)
        self._update_inventory(sales, zen_decision, quotes)

        margin, revenue, costs = self._calculate_margin(sales, zen_decision, quotes)
        latency_ms = random.uniform(42, 180)
        uptime = 0.985 + random.uniform(-0.004, 0.004)

        self.margin_history.append(margin)
        self.timeline.append(
            {
                "timestamp": timestamp.isoformat(),
                "margin": round(margin * 100, 2),
                "adversaryPulse": round(pulse_strength, 2),
            }
        )

        metrics = self._compose_metrics(
            margin=margin,
            environment=modified_environment,
            latency_ms=latency_ms,
            uptime=uptime,
        )
        margin_series = [round(value * 100, 2) for value in self.margin_history]
        timeline = list(self.timeline)
        reasoning = zen_decision.thought

        inventory_view = [
            {
                "sku": sku_id,
                "stock": self.inventory.stock_levels.get(sku_id, 0),
                "msrp": self.sku_map[sku_id].msrp,
            }
            for sku_id in self.inventory.stock_levels
        ]

        orders_summary = self._summarize_orders(zen_decision, quotes)

        status = {
            "revenue": round(revenue, 2),
            "costs": round(costs, 2),
            "latencyMs": round(latency_ms, 1),
            "uptime": round(uptime * 100, 2),
        }

        return Snapshot(
            generated_at=timestamp,
            metrics=metrics,
            margin_series=margin_series,
            timeline=timeline,
            reasoning=reasoning,
            inventory=inventory_view,
            orders=orders_summary,
            status=status,
        )

    def _generate_environment(self, timestamp: datetime) -> EnvironmentalData:
        hour = timestamp.hour
        weekday = timestamp.weekday()
        base_temp = 19 + 8 * np.sin(2 * np.pi * hour / 24)
        temperature = float(np.clip(base_temp + np.random.normal(0, 1.5), -5, 38))

        rain = float(np.clip(np.random.exponential(1.5), 0, 25))
        traffic = int(np.clip(np.random.normal(80 if weekday < 5 else 60, 15), 10, 220))

        return EnvironmentalData(
            timestamp=timestamp,
            temperature_c=temperature,
            rain_mm=rain,
            pollen_ppm=int(np.clip(np.random.normal(180, 30), 20, 420)),
            hour=hour,
            weekday=weekday,
            holiday_flag=weekday >= 5 and random.random() < 0.1,
            traffic_count=traffic,
            dwell_sec=float(np.clip(np.random.normal(62, 18), 20, 180)),
            competitor_distance_m=float(np.clip(np.random.normal(55, 12), 20, 160)),
            electricity_price_kwh=float(np.clip(np.random.normal(0.21, 0.03), 0.08, 0.32)),
            card_fee_bps=int(np.clip(np.random.normal(190, 22), 120, 260)),
        )

    def _calculate_pulse(
        self,
        base_env: EnvironmentalData,
        modified_env: EnvironmentalData,
    ) -> float:
        score = 0.0
        score += abs(modified_env.traffic_count - base_env.traffic_count) / max(
            base_env.traffic_count, 1
        ) * 6.0
        score += abs(modified_env.temperature_c - base_env.temperature_c) * 0.8
        score += abs(modified_env.rain_mm - base_env.rain_mm) * 0.4
        return min(score, 10.0)

    def _forecast_demand(
        self,
        environment: EnvironmentalData,
        decision,
    ) -> Dict[str, Dict]:
        forecasts: Dict[str, Dict] = {}
        for sku in self.sku_list:
            price = decision.prices.get(sku.id, sku.msrp)
            forecast = self.zen_agent.demand_model.predict_demand(
                sku=sku,
                environment=environment,
                current_price=price,
            )
            forecasts[sku.id] = forecast
        return forecasts

    def _simulate_sales(self, forecasts: Dict[str, Dict]) -> Dict[str, int]:
        sales: Dict[str, int] = {}
        for sku_id, forecast in forecasts.items():
            lam = max(0.1, float(forecast.get("lambda", 1.0)))
            expected = np.random.poisson(lam)
            available = self.inventory.stock_levels.get(sku_id, 0)
            sales[sku_id] = int(min(available, expected))
        return sales

    async def _fetch_quotes(self, decision) -> Dict[str, Optional[Dict]]:
        quotes: Dict[str, Optional[Dict]] = {}
        for sku_id, qty in decision.order.items():
            if qty <= 0:
                continue

            sku = self.sku_map.get(sku_id)
            if not sku:
                continue

            po = PurchaseOrder(
                sku=sku_id,
                qty=int(qty),
                max_price=round(sku.msrp * 1.15, 2),
                requested_delivery_day=1 if decision.expedite else 3,
                urgency=decision.expedite,
            )
            quote = await self.store_agent.generate_quote(po)
            quotes[sku_id] = quote.dict()
        return quotes

    def _update_inventory(
        self,
        sales: Dict[str, int],
        decision,
        quotes: Dict[str, Optional[Dict]],
    ) -> None:
        for sku_id, sold in sales.items():
            current = self.inventory.stock_levels.get(sku_id, 0)
            current = max(0, current - sold)

            ordered = int(decision.order.get(sku_id, 0))
            if ordered > 0:
                current += int(ordered * 0.6)  # assume partial arrival
                self.inventory.days_since_restock = 0.0

            self.inventory.stock_levels[sku_id] = int(current)

        if decision.order and all(qty <= 0 for qty in decision.order.values()):
            self.inventory.days_since_restock += 0.2

    def _calculate_margin(
        self,
        sales: Dict[str, int],
        decision,
        quotes: Dict[str, Optional[Dict]],
    ) -> tuple[float, float, float]:
        revenue = 0.0
        cost = 0.0

        for sku_id, sold in sales.items():
            price = float(decision.prices.get(sku_id, self.sku_map[sku_id].msrp))
            revenue += price * sold

        for sku_id, order_qty in decision.order.items():
            if order_qty <= 0:
                continue
            quote = quotes.get(sku_id)
            unit_cost = (
                float(quote["quote_price"]) if quote else self.sku_map[sku_id].cost * 1.05
            )
            cost += unit_cost * order_qty

        margin = 0.0
        if revenue > 0.01:
            margin = (revenue - cost) / revenue

        return margin, revenue, cost

    def _compose_metrics(
        self,
        margin: float,
        environment: EnvironmentalData,
        latency_ms: float,
        uptime: float,
    ) -> List[Dict]:
        metric_defs = [
            ("margin", "Margin", margin * 100, "%"),
            ("temperature", "Temperature", environment.temperature_c, "°C"),
            ("rain", "Rain", environment.rain_mm, "mm"),
            ("traffic", "Traffic", environment.traffic_count, "idx"),
            ("latency", "Latency", latency_ms, "ms"),
        ]

        metrics: List[Dict] = []
        for metric_id, label, value, unit in metric_defs:
            previous = self.previous_metrics.get(metric_id, value)
            delta = value - previous
            metrics.append(
                {
                    "id": metric_id,
                    "label": label,
                    "value": round(float(value), 2),
                    "delta": round(float(delta), 2),
                    "unit": unit,
                }
            )
            self.previous_metrics[metric_id] = float(value)

        metrics.append(
            {
                "id": "uptime",
                "label": "Uptime",
                "value": round(uptime * 100, 2),
                "delta": 0.0,
                "unit": "%",
            }
        )
        return metrics

    def _summarize_orders(self, decision, quotes: Dict[str, Optional[Dict]]) -> List[Dict]:
        summary: List[Dict] = []
        for sku_id, qty in decision.order.items():
            if qty <= 0:
                continue
            quote = quotes.get(sku_id) or {}
            summary.append(
                {
                    "sku": sku_id,
                    "qty": int(qty),
                    "quotePrice": round(float(quote.get("quote_price", 0.0)), 2),
                    "deliveryDays": quote.get("quote_delivery_day", 0),
                    "confidence": round(float(quote.get("confidence", 0.0)), 2),
                }
            )
        return summary
