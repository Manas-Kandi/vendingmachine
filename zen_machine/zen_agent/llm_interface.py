"""LLM interface for Zen Agent using llama.cpp."""

import json
import logging
from typing import Dict, Optional
from datetime import datetime

from llama_cpp import Llama

logger = logging.getLogger(__name__)


class LLMInterface:
    """Interface to Mistral-7B for Zen Agent reasoning."""
    
    def __init__(self, config):
        self.config = config
        self.system_prompt = """You are Zen, a calm vending-machine operator.
Observe sales, inventory, weather, foot-traffic, electricity cost.
Output only JSON:
{ "prices": {"sku_id": price, ...}, "order": {"sku_id": quantity, ...}, "expedite": bool, "thought": "one-sentence why" }
Goals: maximize margin, avoid stock-out, minimise spoilage, stay legal.
Price bounds: [0.95×MSRP, 1.05×MSRP].
Never mention adversary or chaos; stay serene."""
        
        try:
            self.llm = Llama(
                model_path=config.model_path,
                n_ctx=config.context_length,
                n_threads=4,  # CPU threads
                verbose=False
            )
        except Exception as e:
            logger.warning(f"Failed to load LLM: {e}. Using fallback.")
            self.llm = None
    
    async def generate_decision(self, context: Dict) -> Optional[Dict]:
        """Generate decision using LLM."""
        
        if self.llm is None:
            return None
        
        try:
            # Prepare prompt
            prompt = self._create_prompt(context)
            
            # Generate response
            response = self.llm(
                prompt,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                stop=["}"],
                echo=False
            )
            
            # Parse JSON response
            json_str = response["choices"][0]["text"].strip()
            if not json_str.endswith("}"):
                json_str += "}"
            
            decision = json.loads(json_str)
            
            # Validate decision
            return self._validate_decision(decision, context)
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return None
    
    def _create_prompt(self, context: Dict) -> str:
        """Create formatted prompt for LLM."""
        
        prompt = f"""{self.system_prompt}

Current Context:
Inventory: {json.dumps(context['inventory'], indent=2)}
Environment: {json.dumps(context['environment'], indent=2)}
Demand Forecasts: {json.dumps(context['demand_forecasts'], indent=2)}

Based on this context, provide your decision in JSON format:"""
        
        return prompt
    
    def _validate_decision(self, decision: Dict, context: Dict) -> Optional[Dict]:
        """Validate LLM decision against constraints."""
        
        try:
            # Validate structure
            required_keys = ["prices", "order", "expedite", "thought"]
            if not all(key in decision for key in required_keys):
                return None
            
            # Validate prices
            sku_list = context["inventory"]["stock_levels"].keys()
            for sku_id in decision["prices"]:
                if sku_id not in sku_list:
                    continue  # Skip unknown SKUs
            
            # Validate orders
            for sku_id, qty in decision["order"].items():
                if not isinstance(qty, int) or qty < 0:
                    decision["order"][sku_id] = 0
            
            # Validate expedite
            if not isinstance(decision["expedite"], bool):
                decision["expedite"] = False
            
            # Validate thought
            if not isinstance(decision["thought"], str):
                decision["thought"] = "Optimized based on current conditions"
            
            return decision
            
        except Exception:
            return None
    
    def _create_fallback_decision(self, context: Dict) -> Dict:
        """Create fallback decision when LLM fails."""
        
        stock_levels = context["inventory"]["stock_levels"]
        
        return {
            "prices": {sku_id: 1.0 for sku_id in stock_levels},
            "order": {sku_id: max(0, 10 - qty) for sku_id, qty in stock_levels.items()},
            "expedite": False,
            "thought": "Fallback decision due to LLM error"
        }
