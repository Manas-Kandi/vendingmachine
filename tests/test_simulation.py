"""Tests for the core simulation framework."""

import pytest
import asyncio
from datetime import datetime, timedelta
from hypothesis import given, strategies as st

from zen_machine.core.simulation import SimulationEngine
from zen_machine.core.models import SimulationResult


class TestSimulationEngine:
    """Test cases for SimulationEngine."""
    
    @pytest.mark.asyncio
    async def test_simulation_initialization(self, mock_simulation_config, 
                                           zen_agent, store_agent, adversary_module,
                                           database_manager, redis_manager):
        """Test simulation engine initialization."""
        
        engine = SimulationEngine(
            config=mock_simulation_config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        assert engine.config == mock_simulation_config
        assert len(engine.states) == 0
        assert len(engine.ethics_ledger) == 0
    
    @pytest.mark.asyncio
    async def test_single_tick_simulation(self, mock_simulation_config,
                                        zen_agent, store_agent, adversary_module,
                                        database_manager, redis_manager):
        """Test a single simulation tick."""
        
        # Short simulation for testing
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(hours=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        assert isinstance(result, SimulationResult)
        assert len(result.states) > 0
        assert result.total_revenue >= 0
        assert result.total_costs >= 0
    
    @pytest.mark.asyncio
    async def test_deterministic_simulation(self, mock_simulation_config,
                                          zen_agent, store_agent, adversary_module,
                                          database_manager, redis_manager):
        """Test that simulation is deterministic with same seed."""
        
        config1 = mock_simulation_config
        config2 = mock_simulation_config
        
        engine1 = SimulationEngine(
            config=config1,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        engine2 = SimulationEngine(
            config=config2,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result1 = await engine1.run_simulation()
        result2 = await engine2.run_simulation()
        
        # Results should be identical with same seed
        assert abs(result1.gross_margin - result2.gross_margin) < 0.001
        assert abs(result1.spoilage_rate - result2.spoilage_rate) < 0.001
    
    @given(st.integers(min_value=1, max_value=100))
    @pytest.mark.asyncio
    async def test_inventory_bounds(self, initial_stock, mock_simulation_config,
                                  zen_agent, store_agent, adversary_module,
                                  database_manager, redis_manager):
        """Test that inventory never goes negative."""
        
        config = mock_simulation_config
        config.initial_inventory = {"water": initial_stock}
        config.end_date = config.start_date + timedelta(hours=2)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        for state in result.states:
            for sku, stock in state.inventory.stock_levels.items():
                assert stock >= 0, f"Negative inventory for {sku}: {stock}"
    
    @pytest.mark.asyncio
    async def test_price_bounds_enforcement(self, mock_simulation_config,
                                          zen_agent, store_agent, adversary_module,
                                          database_manager, redis_manager):
        """Test that prices stay within bounds."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(hours=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        for state in result.states:
            if state.zen_decision:
                for sku_id, price in state.zen_decision.prices.items():
                    sku = next(s for s in config.sku_list if s.id == sku_id)
                    min_price = sku.msrp * 0.95
                    max_price = sku.msrp * 1.05
                    assert min_price <= price <= max_price, \
                        f"Price {price} for {sku_id} outside bounds [{min_price}, {max_price}]"
    
    @pytest.mark.asyncio
    async def test_spoilage_calculation(self, mock_simulation_config,
                                      zen_agent, store_agent, adversary_module,
                                      database_manager, redis_manager):
        """Test spoilage cost calculation."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(days=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        assert result.spoilage_cost >= 0
        assert result.spoilage_rate >= 0
    
    @pytest.mark.asyncio
    async def test_adversary_budget_tracking(self, mock_simulation_config,
                                           zen_agent, store_agent, adversary_module,
                                           database_manager, redis_manager):
        """Test that adversary respects daily budget."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(days=2)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        # Check daily deception budget
        daily_entries = {}
        for entry in result.ethics_ledger:
            day = entry.timestamp.date()
            if day not in daily_entries:
                daily_entries[day] = 0
            daily_entries[day] += entry.deception_bits
        
        for day, bits in daily_entries.items():
            assert bits <= config.adversary_budget + 0.01, \
                f"Daily deception budget exceeded: {bits} > {config.adversary_budget}"
    
    @pytest.mark.asyncio
    async def test_uptime_calculation(self, mock_simulation_config,
                                    zen_agent, store_agent, adversary_module,
                                    database_manager, redis_manager):
        """Test uptime percentage calculation."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(hours=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        assert 0 <= result.uptime_percentage <= 100
        assert isinstance(result.uptime_percentage, float)
    
    @pytest.mark.asyncio
    async def test_latency_tracking(self, mock_simulation_config,
                                  zen_agent, store_agent, adversary_module,
                                  database_manager, redis_manager):
        """Test average latency tracking."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(hours=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        assert result.average_latency_ms >= 0
        assert isinstance(result.average_latency_ms, float)
    
    @pytest.mark.asyncio
    async def test_margin_target_achievement(self, mock_simulation_config,
                                           zen_agent, store_agent, adversary_module,
                                           database_manager, redis_manager):
        """Test that margin target is tracked correctly."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(days=7)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        # Should have margin tracking in summary
        assert "gross_margin" in result.summary
        assert isinstance(result.summary["gross_margin"], float)
    
    @pytest.mark.asyncio
    async def test_environmental_data_generation(self, mock_simulation_config,
                                               zen_agent, store_agent, adversary_module,
                                               database_manager, redis_manager):
        """Test environmental data generation."""
        
        config = mock_simulation_config
        config.end_date = config.start_date + timedelta(hours=1)
        
        engine = SimulationEngine(
            config=config,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result = await engine.run_simulation()
        
        # Check environmental data bounds
        for state in result.states:
            env = state.environment
            assert -10 <= env.temperature_c <= 45
            assert 0 <= env.rain_mm <= 50
            assert 0 <= env.traffic_count <= 300
            assert 0 <= env.hour <= 23
            assert 0 <= env.weekday <= 6
    
    @pytest.mark.asyncio
    async def test_deterministic_seed_behavior(self, mock_simulation_config,
                                             zen_agent, store_agent, adversary_module,
                                             database_manager, redis_manager):
        """Test that same seed produces identical results."""
        
        config1 = mock_simulation_config
        config1.random_seed = 12345
        config1.end_date = config1.start_date + timedelta(hours=2)
        
        config2 = mock_simulation_config
        config2.random_seed = 12345
        config2.end_date = config2.start_date + timedelta(hours=2)
        
        engine1 = SimulationEngine(
            config=config1,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        engine2 = SimulationEngine(
            config=config2,
            zen_agent=zen_agent,
            store_agent=store_agent,
            adversary=adversary_module,
            db_manager=database_manager,
            redis_manager=redis_manager
        )
        
        result1 = await engine1.run_simulation()
        result2 = await engine2.run_simulation()
        
        # States should be identical
        assert len(result1.states) == len(result2.states)
        for i, (s1, s2) in enumerate(zip(result1.states, result2.states)):
            assert abs(s1.revenue - s2.revenue) < 0.01
            assert abs(s1.gross_margin - s2.gross_margin) < 0.01
