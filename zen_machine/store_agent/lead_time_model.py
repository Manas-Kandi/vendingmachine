"""Lead time model for Store Agent delivery estimates."""

import random
from typing import Dict, Optional
import numpy as np


class LeadTimeModel:
    """Lead time prediction with weather and urgency factors."""
    
    def __init__(self, config):
        self.config = config
        
        # Base lead times by SKU category (days)
        self.base_lead_times = {
            "beverage": 2,
            "snack": 1,
            "healthy": 3,
            "energy": 2,
            "candy": 1
        }
        
    def calculate_lead_time(
        self,
        quantity: int,
        weather_delay: float = 0.0,
        urgency: bool = False,
        sku_category: str = "beverage"
    ) -> int:
        """Calculate estimated lead time in days."""
        
        # Base lead time
        base_time = self.base_lead_times.get(sku_category, 2)
        
        # Quantity adjustment
        quantity_factor = self._calculate_quantity_factor(quantity)
        
        # Weather delay
        weather_factor = 1.0 + weather_delay
        
        # Urgency adjustment
        urgency_factor = 0.7 if urgency else 1.0  # Faster for urgent orders
        
        # Calculate final lead time
        lead_time = base_time * quantity_factor * weather_factor * urgency_factor
        
        # Ensure minimum 1 day
        lead_time = max(1, int(np.ceil(lead_time)))
        
        return lead_time
    
    def _calculate_quantity_factor(self, quantity: int) -> float:
        """Calculate lead time multiplier based on quantity."""
        
        if quantity >= 100:
            return 1.5  # 50% longer for large orders
        elif quantity >= 50:
            return 1.2  # 20% longer for medium orders
        elif quantity >= 20:
            return 1.1  # 10% longer for small orders
        else:
            return 1.0  # Standard lead time
    
    def get_weather_delay(self, rain_mm: float, temperature_c: float) -> float:
        """Calculate weather-related delay factor."""
        
        # Rain delay
        rain_delay = min(0.5, rain_mm / 20)  # Max 50% delay for heavy rain
        
        # Temperature delay (extreme weather)
        temp_delay = 0.0
        if temperature_c < -5 or temperature_c > 35:
            temp_delay = 0.2  # 20% delay for extreme temperatures
        
        return rain_delay + temp_delay
    
    def get_probability_distribution(
        self,
        base_lead_time: int,
        weather_delay: float = 0.0
    ) -> Dict[int, float]:
        """Get probability distribution for lead time."""
        
        # Normal distribution around expected lead time
        expected = base_lead_time * (1 + weather_delay)
        std_dev = max(0.5, expected * 0.1)  # 10% standard deviation
        
        # Generate discrete probabilities
        probabilities = {}
        for days in range(max(1, int(expected - 3 * std_dev)), 
                         int(expected + 3 * std_dev) + 1):
            prob = np.exp(-0.5 * ((days - expected) / std_dev) ** 2)
            prob /= (std_dev * np.sqrt(2 * np.pi))
            probabilities[days] = float(prob)
        
        # Normalize
        total = sum(probabilities.values())
        return {k: v/total for k, v in probabilities.items()}
