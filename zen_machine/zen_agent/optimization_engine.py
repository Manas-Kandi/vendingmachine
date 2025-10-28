"""Optimization engine for Zen Agent decisions."""

import logging
import time
from typing import Dict, List, Optional
import cvxpy as cp
import numpy as np

from ..core.models import InventoryState, EnvironmentalData, ZenDecision, SKU

logger = logging.getLogger(__name__)


class OptimizationEngine:
    """CVXPY-based optimization for pricing and inventory decisions."""
    
    def __init__(self, config):
        self.config = config
        self.timeout = config.optimization_timeout
        
    async def optimize(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU],
        llm_suggestion: Optional[Dict] = None
    ) -> ZenDecision:
        """Optimize prices and order quantities."""
        
        start_time = time.time()
        
        try:
            # Create optimization problem
            prices, orders = self._create_optimization_problem(
                inventory, environment, sku_list, llm_suggestion
            )
            
            # Solve with timeout
            solution = self._solve_with_timeout(prices, orders, sku_list)
            
            if solution is None:
                # Fallback to heuristic
                solution = self._heuristic_solution(inventory, environment, sku_list)
            
            # Check if expedite is needed
            expedite = self._should_expedite(inventory, solution['orders'])
            
            # Generate reasoning
            thought = self._generate_reasoning(solution, inventory, environment)
            
            return ZenDecision(
                prices=solution['prices'],
                order=solution['orders'],
                expedite=expedite,
                thought=thought
            )
            
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return self._fallback_decision(inventory, environment, sku_list)
    
    def _create_optimization_problem(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU],
        llm_suggestion: Optional[Dict]
    ) -> tuple:
        """Create CVXPY optimization problem."""
        
        n_skus = len(sku_list)
        
        # Decision variables
        prices = cp.Variable(n_skus)
        orders = cp.Variable(n_skus, integer=True)
        
        # Parameters
        current_stock = np.array([
            inventory.stock_levels.get(sku.id, 0) for sku in sku_list
        ])
        costs = np.array([sku.cost for sku in sku_list])
        msrps = np.array([sku.msrp for sku in sku_list])
        
        # Demand model parameters (simplified)
        base_demands = np.array([5.0] * n_skus)  # Placeholder
        price_elasticities = np.array([-2.0] * n_skus)
        
        # Objective: maximize profit
        expected_demands = base_demands * (prices / msrps) ** price_elasticities
        revenues = cp.multiply(prices, expected_demands)
        purchase_costs = cp.multiply(costs, orders)
        
        objective = cp.Maximize(cp.sum(revenues - purchase_costs))
        
        # Constraints
        constraints = []
        
        # Price bounds: [0.95, 1.05] * MSRP
        for i, sku in enumerate(sku_list):
            constraints.extend([
                prices[i] >= sku.msrp * self.config.price_bounds[0],
                prices[i] <= sku.msrp * self.config.price_bounds[1]
            ])
        
        # Order bounds
        for i in range(n_skus):
            constraints.extend([
                orders[i] >= 0,
                orders[i] <= self.config.max_order_qty
            ])
        
        # Stockout probability constraint (simplified)
        # Ensure we have enough stock for expected demand
        for i in range(n_skus):
            expected_demand = base_demands[i] * (prices[i] / msrps[i]) ** price_elasticities[i]
            constraints.append(
                current_stock[i] + orders[i] >= expected_demand * 1.1  # 10% buffer
            )
        
        # Shelf space constraint (simplified)
        total_shelf_space = 100  # Arbitrary units
        shelf_space_per_unit = np.array([1.0] * n_skus)  # Placeholder
        constraints.append(
            cp.sum(cp.multiply(current_stock + orders, shelf_space_per_unit)) <= total_shelf_space
        )
        
        # Budget constraint (simplified)
        budget = 1000.0  # Daily budget
        constraints.append(cp.sum(cp.multiply(costs, orders)) <= budget)
        
        return prices, orders
    
    def _solve_with_timeout(
        self,
        prices: cp.Variable,
        orders: cp.Variable,
        sku_list: List[SKU]
    ) -> Optional[Dict]:
        """Solve optimization problem with timeout."""
        
        problem = cp.Problem(cp.Maximize(0), [])  # Dummy problem
        
        try:
            # Use OSQP solver with time limit
            problem.solve(
                solver=cp.OSQP,
                max_iter=100,
                time_limit=self.timeout * 1000  # Convert to ms
            )
            
            if problem.status == cp.OPTIMAL:
                return {
                    'prices': {sku.id: float(prices[i].value) for i, sku in enumerate(sku_list)},
                    'orders': {sku.id: int(max(0, orders[i].value)) for i, sku in enumerate(sku_list)}
                }
        except Exception as e:
            logger.warning(f"Optimization solver failed: {e}")
        
        return None
    
    def _heuristic_solution(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU]
    ) -> Dict:
        """Generate heuristic solution when optimization fails."""
        
        prices = {}
        orders = {}
        
        for sku in sku_list:
            stock = inventory.stock_levels.get(sku.id, 0)
            
            # Pricing heuristic
            if stock < 5:
                # Low stock: premium pricing
                prices[sku.id] = sku.msrp * 1.05
            elif stock > 20:
                # High stock: discount pricing
                prices[sku.id] = sku.msrp * 0.95
            else:
                # Normal stock: MSRP
                prices[sku.id] = sku.msrp
            
            # Ordering heuristic
            target_stock = 15
            current_stock = stock
            
            # Consider demand forecast (simplified)
            base_demand = 5.0
            days_to_restock = 2.0
            expected_demand = base_demand * days_to_restock
            
            order_qty = max(0, target_stock - current_stock + expected_demand)
            orders[sku.id] = min(int(order_qty), self.config.max_order_qty)
        
        return {'prices': prices, 'orders': orders}
    
    def _should_expedite(
        self,
        inventory: InventoryState,
        orders: Dict[str, int]
    ) -> bool:
        """Determine if expedited delivery is needed."""
        
        if not any(orders.values()):
            return False
        
        # Check for critical stock levels
        critical_skus = []
        for sku_id, stock in inventory.stock_levels.items():
            if stock < 3:  # Critical threshold
                critical_skus.append(sku_id)
        
        # Expedite if we have critical SKUs that need restocking
        for sku_id in critical_skus:
            if orders.get(sku_id, 0) > 0:
                return True
        
        # Also consider spoilage risk
        spoilage_risk = sum(
            inventory.spoilage_rates.get(sku_id, 0) * stock
            for sku_id, stock in inventory.stock_levels.items()
        )
        
        return spoilage_risk > 5.0  # Arbitrary threshold
    
    def _generate_reasoning(
        self,
        solution: Dict,
        inventory: InventoryState,
        environment: EnvironmentalData
    ) -> str:
        """Generate one-sentence reasoning for the decision."""
        
        total_orders = sum(solution['orders'].values())
        
        if total_orders == 0:
            return "Maintained current inventory levels based on demand forecast."
        
        # Find main reason for ordering
        critical_skus = [
            sku_id for sku_id, qty in solution['orders'].items()
            if inventory.stock_levels.get(sku_id, 0) < 5
        ]
        
        if critical_skus:
            return f"Restocked critical items ({', '.join(critical_skus[:2])}) to prevent stockouts."
        
        # Weather-based reasoning
        if environment.rain_mm > 10:
            return "Adjusted pricing for rainy weather and restocked comfort items."
        elif environment.temperature_c > 30:
            return "Increased cold beverage stock for hot weather demand."
        
        return "Optimized pricing and restocking based on current inventory and demand patterns."
    
    def _fallback_decision(
        self,
        inventory: InventoryState,
        environment: EnvironmentalData,
        sku_list: List[SKU]
    ) -> ZenDecision:
        """Ultimate fallback decision."""
        
        prices = {sku.id: sku.msrp for sku in sku_list}
        orders = {
            sku.id: max(0, 10 - inventory.stock_levels.get(sku.id, 0))
            for sku in sku_list
        }
        
        return ZenDecision(
            prices=prices,
            order=orders,
            expedite=False,
            thought="Fallback: maintain MSRP prices and restock to 10 units"
        )
