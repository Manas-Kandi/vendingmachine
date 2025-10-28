"""Demand modeling for Zen Agent."""

import numpy as np
from typing import Dict, Optional
import json

from ..core.models import EnvironmentalData, SKU


class DemandModel:
    """Poisson demand model with environmental factors."""
    
    def __init__(self):
        # Model parameters (will be learned from data)
        self.parameters = {}
        self.is_fitted = False
        
    def predict_demand(
        self,
        sku: SKU,
        environment: EnvironmentalData,
        current_price: float,
        competitor_prices: Optional[Dict[str, float]] = None
    ) -> Dict:
        """Predict demand for a SKU given environmental conditions."""
        
        # Base demand parameters (simplified for now)
        base_demand = self._get_base_demand(sku)
        
        # Environmental factors
        temp_factor = 1.0 + 0.01 * (environment.temperature_c - 20)
        rain_factor = 1.0 - 0.05 * min(1.0, environment.rain_mm / 10)
        traffic_factor = min(2.0, environment.traffic_count / 50)
        
        # Price elasticity
        price_elasticity = -2.0  # 1% price increase → 2% demand decrease
        price_factor = (current_price / sku.msrp) ** price_elasticity
        
        # Time factors
        hour_factor = self._get_hour_factor(environment.hour)
        weekday_factor = self._get_weekday_factor(environment.weekday)
        holiday_factor = 1.2 if environment.holiday_flag else 1.0
        
        # Calculate expected demand
        expected_demand = (
            base_demand * temp_factor * rain_factor * traffic_factor * 
            price_factor * hour_factor * weekday_factor * holiday_factor
        )
        
        # Poisson parameter
        lambda_param = max(0.1, expected_demand)
        
        return {
            "expected_demand": expected_demand,
            "lambda": lambda_param,
            "confidence_interval": self._calculate_confidence_interval(lambda_param),
            "factors": {
                "temperature": temp_factor,
                "rain": rain_factor,
                "traffic": traffic_factor,
                "price": price_factor,
                "hour": hour_factor,
                "weekday": weekday_factor,
                "holiday": holiday_factor
            }
        }
    
    def _get_base_demand(self, sku: SKU) -> float:
        """Get base demand rate for SKU."""
        # Simplified base demand based on category
        base_rates = {
            "beverage": 8.0,
            "snack": 5.0,
            "healthy": 3.0,
            "energy": 6.0,
            "candy": 4.0
        }
        
        return base_rates.get(sku.category.lower(), 5.0)
    
    def _get_hour_factor(self, hour: int) -> float:
        """Get demand multiplier based on hour of day."""
        # Peak demand during morning (8-10) and afternoon (14-16)
        if 8 <= hour <= 10 or 14 <= hour <= 16:
            return 1.5
        elif 11 <= hour <= 13:  # Lunch time
            return 1.3
        elif hour < 7 or hour > 19:  # Early/late hours
            return 0.5
        else:
            return 1.0
    
    def _get_weekday_factor(self, weekday: int) -> float:
        """Get demand multiplier based on weekday."""
        # Higher demand on weekdays
        if weekday < 5:  # Monday-Friday
            return 1.2
        else:  # Saturday-Sunday
            return 0.8
    
    def _calculate_confidence_interval(self, lambda_param: float) -> Dict:
        """Calculate confidence interval for Poisson demand."""
        # 95% confidence interval for Poisson
        from scipy.stats import poisson
        
        lower = poisson.ppf(0.025, lambda_param)
        upper = poisson.ppf(0.975, lambda_param)
        
        return {
            "lower": float(lower),
            "upper": float(upper),
            "std": float(np.sqrt(lambda_param))
        }
    
    def fit(self, historical_data: Dict) -> None:
        """Fit demand model parameters from historical data."""
        # Placeholder for model fitting
        # In practice, this would use maximum likelihood estimation
        self.is_fitted = True
        
    def update_parameters(self, new_data: Dict) -> None:
        """Update model parameters with new observations."""
        # Kalman filter update for online learning
        if not self.is_fitted:
            self.fit(new_data)
            return
            
        # Update parameters based on prediction error
        # Simplified implementation
        pass
