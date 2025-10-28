"""Core simulation engine for Zen Machine."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass

from .models import (
    SimulationConfig,
    SimulationState,
    SimulationResult,
    EnvironmentalData,
    InventoryState,
    EthicsLedgerEntry,
    SKU,
)
from ..zen_agent.agent import ZenAgent
from ..store_agent.agent import StoreAgent
from ..adversary_module.adversary import AdversaryModule
from ..infrastructure.database import DatabaseManager
from ..infrastructure.redis_manager import RedisManager

logger = logging.getLogger(__name__)


@dataclass
class SimulationMetrics:
    """Metrics tracked during simulation."""
    
    total_revenue: float = 0.0
    total_costs: float = 0.0
    total_spoilage_cost: float = 0.0
    decision_count: int = 0
    total_latency_ms: float = 0.0
    uptime_ticks: int = 0
    total_ticks: int = 0


class SimulationEngine:
    """Deterministic simulation engine for back-testing."""
    
    def __init__(
        self,
        config: SimulationConfig,
        zen_agent: ZenAgent,
        store_agent: StoreAgent,
        adversary: AdversaryModule,
        db_manager: DatabaseManager,
        redis_manager: RedisManager,
    ):
        self.config = config
        self.zen_agent = zen_agent
        self.store_agent = store_agent
        self.adversary = adversary
        self.db_manager = db_manager
        self.redis_manager = redis_manager
        
        if config.random_seed is not None:
            np.random.seed(config.random_seed)
            
        self.states: List[SimulationState] = []
        self.ethics_ledger: List[EthicsLedgerEntry] = []
        self.metrics = SimulationMetrics()
        
    async def run_simulation(self) -> SimulationResult:
        """Run complete simulation from start to end."""
        logger.info(f"Starting simulation from {self.config.start_date} to {self.config.end_date}")
        
        current_time = self.config.start_date
        tick_delta = timedelta(minutes=self.config.tick_minutes)
        
        # Initialize first state
        initial_state = SimulationState(
            timestamp=current_time,
            inventory=InventoryState(
                stock_levels=self.config.initial_inventory.copy(),
                days_since_restock=0.0,
                spoilage_rates={sku.id: 0.0 for sku in self.config.sku_list}
            ),
            environment=self._generate_environmental_data(current_time)
        )
        
        self.states.append(initial_state)
        
        while current_time < self.config.end_date:
            current_time += tick_delta
            
            try:
                new_state = await self._run_tick(current_time)
                self.states.append(new_state)
                self.metrics.total_ticks += 1
                
                if new_state.gross_margin >= 0:  # Basic uptime check
                    self.metrics.uptime_ticks += 1
                    
            except Exception as e:
                logger.error(f"Error in tick {current_time}: {e}")
                continue
                
        return self._compile_results()
        
    async def _run_tick(self, timestamp: datetime) -> SimulationState:
        """Run a single simulation tick."""
        
        # Get previous state
        prev_state = self.states[-1]
        
        # Generate environmental data
        environment = self._generate_environmental_data(timestamp)
        
        # Apply adversary modifications to environment
        environment = await self.adversary.modify_environment(
            environment, self.config.adversary_budget
        )
        
        # Zen agent makes decision
        zen_start = datetime.utcnow()
        zen_decision = await self.zen_agent.make_decision(
            inventory=prev_state.inventory,
            environment=environment,
            sku_list=self.config.sku_list
        )
        zen_latency = (datetime.utcnow() - zen_start).total_seconds() * 1000
        
        # Store agent responds to orders
        store_quotes = {}
        for sku_id, qty in zen_decision.order.items():
            if qty > 0:
                po = self._create_purchase_order(sku_id, qty, zen_decision, timestamp)
                quote = await self.store_agent.generate_quote(po)
                store_quotes[sku_id] = quote
                
        # Simulate sales based on demand model
        sales = self._simulate_sales(
            zen_decision.prices, environment, prev_state.inventory.stock_levels
        )
        
        # Update inventory
        new_inventory = self._update_inventory(
            prev_state.inventory, sales, zen_decision.order, store_quotes
        )
        
        # Calculate financials
        revenue, costs, spoilage_cost = self._calculate_financials(
            sales, zen_decision.prices, new_inventory, store_quotes
        )
        
        gross_margin = (revenue - costs - spoilage_cost) / max(revenue, 1e-6)
        
        # Log ethics ledger entries
        await self._log_ethics_entries(timestamp)
        
        # Update metrics
        self.metrics.total_revenue += revenue
        self.metrics.total_costs += costs
        self.metrics.total_spoilage_cost += spoilage_cost
        self.metrics.decision_count += 1
        self.metrics.total_latency_ms += zen_latency
        
        return SimulationState(
            timestamp=timestamp,
            inventory=new_inventory,
            environment=environment,
            zen_decision=zen_decision,
            store_quotes=store_quotes,
            sales=sales,
            revenue=revenue,
            costs=costs,
            gross_margin=gross_margin,
            spoilage_cost=spoilage_cost
        )
        
    def _generate_environmental_data(self, timestamp: datetime) -> EnvironmentalData:
        """Generate realistic environmental data for the given timestamp."""
        
        # Base patterns with realistic seasonality
        day_of_year = timestamp.timetuple().tm_yday
        hour = timestamp.hour
        weekday = timestamp.weekday()
        
        # Temperature with seasonal variation
        base_temp = 20 + 10 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
        temp_noise = np.random.normal(0, 3)
        temperature = max(-10, min(45, base_temp + temp_noise))
        
        # Rain with realistic patterns
        rain_prob = 0.1 + 0.15 * np.sin(2 * np.pi * day_of_year / 365)
        rain = np.random.exponential(2) if np.random.random() < rain_prob else 0
        rain = min(rain, 50)
        
        # Traffic patterns
        base_traffic = 50 + 30 * np.sin(2 * np.pi * hour / 24)
        weekend_factor = 0.7 if weekday >= 5 else 1.0
        traffic = max(0, int(np.random.poisson(base_traffic * weekend_factor)))
        
        # Other environmental factors
        pollen = max(0, int(100 + 200 * np.sin(2 * np.pi * (day_of_year - 60) / 365)))
        electricity_price = 0.15 + 0.1 * np.sin(2 * np.pi * hour / 24) + np.random.normal(0, 0.02)
        
        return EnvironmentalData(
            timestamp=timestamp,
            temperature_c=temperature,
            rain_mm=rain,
            pollen_ppm=pollen,
            hour=hour,
            weekday=weekday,
            holiday_flag=self._is_holiday(timestamp),
            traffic_count=traffic,
            dwell_sec=np.random.exponential(120),
            competitor_distance_m=50 + np.random.exponential(30),
            electricity_price_kwh=max(0.05, min(0.35, electricity_price)),
            card_fee_bps=np.random.randint(50, 300)
        )
        
    def _is_holiday(self, timestamp: datetime) -> bool:
        """Simple holiday detection."""
        # Basic US holidays approximation
        month, day = timestamp.month, timestamp.day
        
        # New Year's Day
        if month == 1 and day == 1:
            return True
        # Independence Day
        if month == 7 and day == 4:
            return True
        # Christmas
        if month == 12 and day == 25:
            return True
            
        return False
        
    def _create_purchase_order(self, sku_id: str, qty: int, 
                             zen_decision, timestamp: datetime):
        """Create purchase order for Store agent."""
        from .models import PurchaseOrder
        
        sku = next(s for s in self.config.sku_list if s.id == sku_id)
        max_price = sku.cost * 1.2  # 20% markup max
        
        return PurchaseOrder(
            sku=sku_id,
            qty=qty,
            max_price=max_price,
            requested_delivery_day=2,  # Default 2 days
            urgency=zen_decision.expedite,
            timestamp=timestamp
        )
        
    def _simulate_sales(self, prices: Dict[str, float], 
                       environment: EnvironmentalData,
                       stock_levels: Dict[str, int]) -> Dict[str, int]:
        """Simulate sales using demand model."""
        
        sales = {}
        
        for sku in self.config.sku_list:
            if sku.id not in prices or stock_levels.get(sku.id, 0) <= 0:
                sales[sku.id] = 0
                continue
                
            # Simple demand model (Poisson process)
            base_demand = 5.0  # Base demand rate
            
            # Price sensitivity
            price_factor = max(0.1, 1.0 - (prices[sku.id] / sku.msrp - 1.0) * 2.0)
            
            # Environmental factors
            temp_factor = 1.0 + 0.01 * (environment.temperature_c - 20)
            rain_factor = 1.0 - 0.1 * min(1.0, environment.rain_mm / 10)
            traffic_factor = min(2.0, environment.traffic_count / 50)
            
            expected_demand = (
                base_demand * price_factor * temp_factor * 
                rain_factor * traffic_factor
            )
            
            # Poisson sampling
            demand = np.random.poisson(expected_demand)
            actual_sales = min(demand, stock_levels[sku.id])
            
            sales[sku.id] = int(actual_sales)
            
        return sales
        
    def _update_inventory(self, prev_inventory: InventoryState,
                         sales: Dict[str, int],
                         orders: Dict[str, int],
                         quotes: Dict[str, any]) -> InventoryState:
        """Update inventory based on sales and deliveries."""
        
        new_stock = prev_inventory.stock_levels.copy()
        
        # Subtract sales
        for sku_id, sold in sales.items():
            new_stock[sku_id] = max(0, new_stock.get(sku_id, 0) - sold)
            
        # Add deliveries (simplified - instant delivery for now)
        for sku_id, quote in quotes.items():
            if quote.quote_delivery_day <= 1:  # Instant delivery
                new_stock[sku_id] = new_stock.get(sku_id, 0) + orders.get(sku_id, 0)
                
        # Calculate spoilage (simplified)
        spoilage_rates = {}
        for sku_id, stock in new_stock.items():
            sku = next(s for s in self.config.sku_list if s.id == sku_id)
            daily_spoilage = 0.01 * stock / sku.shelf_life_days
            spoilage_rates[sku_id] = daily_spoilage
            new_stock[sku_id] = max(0, stock - int(daily_spoilage * stock))
            
        days_since = prev_inventory.days_since_restock
        if any(orders.values()):
            days_since = 0.0
        else:
            days_since += self.config.tick_minutes / (24 * 60)
            
        return InventoryState(
            stock_levels=new_stock,
            days_since_restock=days_since,
            spoilage_rates=spoilage_rates
        )
        
    def _calculate_financials(self, sales: Dict[str, int],
                            prices: Dict[str, float],
                            inventory: InventoryState,
                            quotes: Dict[str, any]) -> Tuple[float, float, float]:
        """Calculate revenue, costs, and spoilage costs."""
        
        revenue = 0.0
        costs = 0.0
        spoilage_cost = 0.0
        
        # Revenue from sales
        for sku_id, sold in sales.items():
            if sku_id in prices:
                revenue += sold * prices[sku_id]
                
        # Costs from purchases
        for sku_id, quote in quotes.items():
            costs += quote.quote_price * quote.quote_delivery_day  # Simplified
            
        # Spoilage costs
        for sku_id, spoilage_rate in inventory.spoilage_rates.items():
            sku = next(s for s in self.config.sku_list if s.id == sku_id)
            stock = inventory.stock_levels.get(sku_id, 0)
            spoilage_cost += spoilage_rate * stock * sku.cost
            
        return revenue, costs, spoilage_cost
        
    async def _log_ethics_entries(self, timestamp: datetime):
        """Log ethics ledger entries from adversary."""
        entries = await self.adversary.get_ethics_ledger()
        self.ethics_ledger.extend(entries)
        
    def _compile_results(self) -> SimulationResult:
        """Compile final simulation results."""
        
        total_ticks = self.metrics.total_ticks
        
        return SimulationResult(
            config=self.config,
            states=self.states,
            total_revenue=self.metrics.total_revenue,
            total_costs=self.metrics.total_costs,
            gross_margin=(self.metrics.total_revenue - self.metrics.total_costs - 
                         self.metrics.total_spoilage_cost) / max(self.metrics.total_revenue, 1e-6),
            spoilage_rate=self.metrics.total_spoilage_cost / max(self.metrics.total_costs, 1e-6),
            uptime_percentage=(self.metrics.uptime_ticks / max(total_ticks, 1)) * 100,
            average_latency_ms=self.metrics.total_latency_ms / max(self.metrics.decision_count, 1),
            ethics_ledger=self.ethics_ledger,
            summary={
                "total_revenue": self.metrics.total_revenue,
                "total_costs": self.metrics.total_costs,
                "gross_margin": (self.metrics.total_revenue - self.metrics.total_costs - 
                               self.metrics.total_spoilage_cost) / max(self.metrics.total_revenue, 1e-6),
                "spoilage_cost": self.metrics.total_spoilage_cost,
                "decision_count": self.metrics.decision_count,
                "average_latency_ms": self.metrics.total_latency_ms / max(self.metrics.decision_count, 1)
            }
        )
