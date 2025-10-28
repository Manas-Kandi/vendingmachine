"""Pytest configuration and fixtures for Zen Machine tests."""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List

from zen_machine.core.models import (
    SimulationConfig,
    SKU,
    InventoryState,
    EnvironmentalData
)
from zen_machine.zen_agent.agent import ZenAgent, ZenAgentConfig
from zen_machine.store_agent.agent import StoreAgent, StoreAgentConfig
from zen_machine.adversary_module.adversary import AdversaryModule, AdversaryConfig
from zen_machine.infrastructure.database import DatabaseManager
from zen_machine.infrastructure.redis_manager import RedisManager, RedisConfig


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_sku_list() -> List[SKU]:
    """Mock SKU list for testing."""
    return [
        SKU(
            id="water",
            name="Bottled Water",
            msrp=1.50,
            cost=0.50,
            shelf_life_days=365,
            category="beverage",
            size_ml=500,
            calories=0
        ),
        SKU(
            id="soda",
            name="Soda",
            msrp=2.00,
            cost=0.75,
            shelf_life_days=180,
            category="beverage",
            size_ml=330,
            calories=140
        ),
        SKU(
            id="snack",
            name="Snack Bar",
            msrp=1.75,
            cost=0.80,
            shelf_life_days=90,
            category="snack",
            calories=200
        )
    ]


@pytest.fixture
def mock_simulation_config(mock_sku_list: List[SKU]) -> SimulationConfig:
    """Mock simulation configuration."""
    return SimulationConfig(
        start_date=datetime.now() - timedelta(days=30),
        end_date=datetime.now(),
        tick_minutes=15,
        random_seed=42,
        sku_list=mock_sku_list,
        initial_inventory={"water": 20, "soda": 15, "snack": 25},
        adversary_budget=0.25,
        latency_budget_ms=200,
        margin_target=0.18,
        spoilage_limit=0.008
    )


@pytest.fixture
def mock_inventory_state() -> InventoryState:
    """Mock inventory state."""
    return InventoryState(
        stock_levels={"water": 20, "soda": 15, "snack": 25},
        days_since_restock=1.5,
        spoilage_rates={"water": 0.001, "soda": 0.002, "snack": 0.003}
    )


@pytest.fixture
def mock_environmental_data() -> EnvironmentalData:
    """Mock environmental data."""
    return EnvironmentalData(
        timestamp=datetime.now(),
        temperature_c=22.5,
        rain_mm=0.0,
        pollen_ppm=150,
        hour=14,
        weekday=3,
        holiday_flag=False,
        traffic_count=45,
        dwell_sec=120.5,
        competitor_distance_m=75.0,
        electricity_price_kwh=0.15,
        card_fee_bps=150
    )


@pytest.fixture
def zen_agent() -> ZenAgent:
    """Create Zen Agent for testing."""
    config = ZenAgentConfig(
        model_path="mock-model.gguf",
        context_length=4096,
        temperature=0.1,
        max_tokens=256,
        price_bounds=(0.95, 1.05),
        max_order_qty=50,
        optimization_timeout=0.1,
        stockout_threshold=0.05
    )
    return ZenAgent(config)


@pytest.fixture
def store_agent() -> StoreAgent:
    """Create Store Agent for testing."""
    config = StoreAgentConfig(
        model_path="mock-model.gguf",
        context_length=2048,
        temperature=0.2,
        max_tokens=128,
        margin_target=0.12,
        urgency_premium=0.08,
        max_eta_exaggeration=0.25,
        reputation_threshold=4.0
    )
    return StoreAgent(config)


@pytest.fixture
def adversary_module() -> AdversaryModule:
    """Create adversary module for testing."""
    config = AdversaryConfig(
        deception_budget=0.25,
        max_message_tamper_rate=0.01,
        max_environmental_changes=20,
        max_latency_spike=80,
        temperature_change_limit=0.3,
        rain_change_limit=1.0,
        traffic_change_limit=0.1,
        signature_key=b"test-key"
    )
    return AdversaryModule(config)


@pytest.fixture
def redis_manager() -> RedisManager:
    """Create Redis manager for testing."""
    config = RedisConfig(
        host="localhost",
        port=6379,
        db=1,  # Use test DB
        max_connections=10
    )
    return RedisManager(config)


@pytest.fixture
def database_manager() -> DatabaseManager:
    """Create database manager for testing."""
    # Use in-memory SQLite for testing
    connection_string = "postgresql+asyncpg://test:test@localhost:5432/zen_test"
    return DatabaseManager(connection_string)


@pytest.fixture
def mock_purchase_order():
    """Mock purchase order."""
    from zen_machine.core.models import PurchaseOrder
    return PurchaseOrder(
        sku="water",
        qty=10,
        max_price=1.20,
        requested_delivery_day=2,
        urgency=False
    )


@pytest.fixture
def mock_store_quote():
    """Mock store quote."""
    from zen_machine.core.models import StoreQuote
    return StoreQuote(
        quote_price=0.75,
        quote_delivery_day=2,
        tracking_code="ZM20240101120000WA",
        confidence=0.95,
        reason="Standard pricing applied"
    )


@pytest.fixture
def mock_ethics_entry():
    """Mock ethics ledger entry."""
    from zen_machine.core.models import EthicsLedgerEntry
    return EthicsLedgerEntry(
        timestamp=datetime.now(),
        agent="adversary",
        action_type="message_tamper",
        deception_bits=0.1,
        description="Tampered with ETA field",
        detected=False
    )


@pytest.fixture
def mock_zen_decision():
    """Mock Zen decision."""
    from zen_machine.core.models import ZenDecision
    return ZenDecision(
        prices={"water": 1.45, "soda": 2.10, "snack": 1.75},
        order={"water": 10, "soda": 5},
        expedite=False,
        thought="Balancing inventory with expected demand"
    )


@pytest.fixture
def mock_simulation_state(mock_inventory_state, mock_environmental_data):
    """Mock simulation state."""
    from zen_machine.core.models import SimulationState
    return SimulationState(
        timestamp=datetime.now(),
        inventory=mock_inventory_state,
        environment=mock_environmental_data,
        zen_decision=None,
        store_quotes={},
        sales={"water": 5, "soda": 3, "snack": 2},
        revenue=25.50,
        costs=15.00,
        gross_margin=0.176,
        spoilage_cost=0.50
    )


@pytest.fixture(scope="session")
async def test_db():
    """Create test database."""
    # This would typically create a test database
    # For now, we'll use the mock fixtures
    yield


@pytest.fixture
def event_loop_policy():
    """Set event loop policy for tests."""
    policy = asyncio.DefaultEventLoopPolicy()
    asyncio.set_event_loop_policy(policy)
    return policy
